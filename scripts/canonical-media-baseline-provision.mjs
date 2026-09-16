import process from "node:process";
import { pathToFileURL } from "node:url";

import {
	CANONICAL_MEDIA_PROVISION_MODES,
	CanonicalMediaBaselineProvisioningError,
	provisionCanonicalMediaBaseline,
} from "../src/features/media/canonicalMediaBaselineProvisioning.js";
import {
	createR2MediaBaselineObjectStore,
	readR2ObjectProbeConfiguration,
} from "../src/features/media/storage/r2Storage.js";

const DEVELOPMENT_CONFIRMATION = "I_CONFIRM_DEVELOPMENT_CANONICAL_MEDIA_PROVISION";
const PRODUCTION_CONFIRMATION = "I_CONFIRM_PRODUCTION_CANONICAL_MEDIA_PROVISION";

/** @typedef {"development" | "production"} CanonicalMediaTarget */

export class CanonicalMediaProvisionConfigurationError extends Error {
	/** @param {string} message @param {unknown} [cause] */
	constructor(message, cause) {
		super(message, cause === undefined ? undefined : { cause });
		this.name = "CanonicalMediaProvisionConfigurationError";
		this.code = "configuration_error";
	}
}

/**
 * Read explicit target and mode settings and refuse ambiguous bucket selection. Verification is
 * allowed for production; production writes require a separate exact confirmation.
 *
 * @param {NodeJS.ProcessEnv} [environment]
 * @param {{target?: string, mode?: string}} [options]
 * @returns {{target: CanonicalMediaTarget, mode: "verify" | "dry-run" | "apply", configuration: ReturnType<typeof readR2ObjectProbeConfiguration>}}
 */
export function readCanonicalMediaProvisionConfiguration(
	environment = process.env,
	{
		target = environment.CANONICAL_MEDIA_TARGET,
		mode = environment.CANONICAL_MEDIA_PROVISION_MODE ?? "verify",
	} = {},
) {
	if (target !== "development" && target !== "production")
		throw new CanonicalMediaProvisionConfigurationError(
			"CANONICAL_MEDIA_TARGET must be explicitly set to development or production.",
		);
	if (!CANONICAL_MEDIA_PROVISION_MODES.includes(mode))
		throw new CanonicalMediaProvisionConfigurationError(
			`CANONICAL_MEDIA_PROVISION_MODE must be one of: ${CANONICAL_MEDIA_PROVISION_MODES.join(", ")}.`,
		);
	let configuration;
	try {
		configuration = readR2ObjectProbeConfiguration(environment);
	} catch (error) {
		throw new CanonicalMediaProvisionConfigurationError(
			"R2 configuration is incomplete or invalid.",
			error,
		);
	}
	if (target === "development" && !isDevelopmentBucketName(configuration.bucketName))
		throw new CanonicalMediaProvisionConfigurationError(
			"Development canonical media provisioning requires a development-scoped R2 bucket.",
		);
	if (target === "production" && isDevelopmentBucketName(configuration.bucketName))
		throw new CanonicalMediaProvisionConfigurationError(
			"Production canonical media provisioning refuses a development-scoped R2 bucket.",
		);
	if (mode === "apply") {
		const expected =
			target === "production" ? PRODUCTION_CONFIRMATION : DEVELOPMENT_CONFIRMATION;
		if (environment.CANONICAL_MEDIA_PROVISION_CONFIRMATION !== expected)
			throw new CanonicalMediaProvisionConfigurationError(
				`Applying canonical media provisioning requires ${target} confirmation.`,
			);
	}
	return { target, mode, configuration };
}

/**
 * Execute explicit baseline verification or provisioning. The default mode is read-only verify.
 *
 * @param {{environment?: NodeJS.ProcessEnv, target?: string, mode?: string, manifest?: import("../src/features/media/media.types.js").CanonicalMediaManifestEntry[], dependencies?: {objectStore?: object}, log?: (message: string) => void}} [options]
 */
export async function runCanonicalMediaBaselineProvision({
	environment = process.env,
	target,
	mode,
	manifest,
	dependencies = {},
	log = (message) =>
		globalThis.console.log(
			`[canonical-media-baseline:${target ?? environment.CANONICAL_MEDIA_TARGET}] ${message}`,
		),
} = {}) {
	const settings = readCanonicalMediaProvisionConfiguration(environment, {
		target,
		mode,
	});
	const objectStore =
		dependencies.objectStore ??
		createR2MediaBaselineObjectStore(settings.configuration);
	const summary = await provisionCanonicalMediaBaseline({
		manifest,
		objectStore,
		mode: settings.mode,
	});
	log(
		`${settings.mode} passed for ${settings.target}: ${summary.total} entries, adopted-existing=${summary.adopted}, byte-identical=${summary.identical}, drift-warnings=${summary.byteDriftWarnings}, created=${summary.created}, missing=${summary.missing}, operational-failures=${summary.failures}`,
	);
	for (const warning of summary.warnings)
		log(
			`warning category=byte-drift-warning entity=${warning.entityType}:${warning.entityKey} objectKey=${warning.objectKey} ${formatIssueDetails(warning.details)}`,
		);
	return { status: "passed", target: settings.target, ...summary };
}

function parseArguments(argumentsList) {
	const options = {};
	for (const argument of argumentsList) {
		const match = argument.match(/^--(target|mode)=(.+)$/u);
		if (!match) throw new Error("Use only --target=<...> and --mode=<...> options.");
		options[match[1]] = match[2];
	}
	return options;
}

async function main() {
	let options;
	try {
		options = parseArguments(process.argv.slice(2));
		await runCanonicalMediaBaselineProvision({
			...options,
		});
	} catch (error) {
		for (const line of formatCanonicalMediaProvisionFailure(error, {
			target: options?.target ?? process.env.CANONICAL_MEDIA_TARGET,
			mode: options?.mode ?? process.env.CANONICAL_MEDIA_PROVISION_MODE ?? "verify",
			bucketName: process.env.R2_BUCKET_NAME,
		}))
			globalThis.console.error(line);
		process.exitCode = 1;
	}
}

/**
 * Format operational failures with safe context. Secret values are never included; provider
 * messages are reduced to their name/code/message and scrubbed for credentials and URLs.
 *
 * @param {unknown} error
 * @param {{target?: string, mode?: string, bucketName?: string}} context
 * @returns {Array<string>}
 */
export function formatCanonicalMediaProvisionFailure(error, context) {
	const target = context.target ?? "unknown";
	const mode = context.mode ?? "unknown";
	const bucket = context.bucketName ? ` bucket=${context.bucketName}` : "";
	const prefix = `[canonical-media-baseline] target=${target} mode=${mode}${bucket}`;
	if (error instanceof CanonicalMediaBaselineProvisioningError)
		return [
			`${prefix} category=canonical-media-verification-failed issues=${error.issues.length}`,
			...error.issues.map((issue) => {
				const identity = issue.entityType
					? ` entity=${issue.entityType}${issue.entityKey ? `:${issue.entityKey}` : ""}`
					: "";
				const objectKey = issue.objectKey ? ` objectKey=${issue.objectKey}` : "";
				const provider = issue.cause
					? ` provider=${describeProviderError(issue.cause)}`
					: "";
				const details = issue.details
					? ` ${Object.entries(issue.details)
							.map(([name, value]) => `${name}=${value}`)
							.join(" ")}`
					: "";
				return `- category=${categorizeProvisioningIssue(issue)}${identity}${objectKey} reason=${issue.reason}${details}${provider}`;
			}),
		];
	if (error instanceof CanonicalMediaProvisionConfigurationError)
		return [
			`${prefix} category=configuration-error reason=${error.message}`,
			...(error.cause ? [`- provider=${describeProviderError(error.cause)}`] : []),
		];
	return [
		`${prefix} category=unexpected-provider-or-api-error reason=${safeMessage(error)}`,
	];
}

/** @param {{reason: string, cause?: unknown}} issue @returns {string} */
function categorizeProvisioningIssue(issue) {
	if (issue.reason.includes("canonical R2 object is missing"))
		return "canonical-object-missing";
	if (issue.reason.includes("different bytes")) return "byte-drift-warning";
	if (issue.reason.includes("manifest") || issue.reason.includes("source file"))
		return "manifest-mismatch";
	if (issue.cause) return categorizeProviderError(issue.cause);
	return "canonical-media-verification-failed";
}

/** @param {Record<string, string | number> | undefined} details @returns {string} */
function formatIssueDetails(details) {
	return details
		? Object.entries(details)
				.map(([name, value]) => `${name}=${value}`)
				.join(" ")
		: "";
}

/** @param {unknown} error @returns {string} */
function categorizeProviderError(error) {
	const candidate =
		/** @type {{name?: unknown, code?: unknown, $metadata?: {httpStatusCode?: unknown}}} */ (
			error
		);
	const name = typeof candidate.name === "string" ? candidate.name : "";
	const code = typeof candidate.code === "string" ? candidate.code : "";
	const status = candidate.$metadata?.httpStatusCode;
	if (
		status === 401 ||
		status === 403 ||
		/AccessDenied|InvalidAccessKey|SignatureDoesNotMatch/iu.test(`${name} ${code}`)
	)
		return "bucket-authentication-or-access-failure";
	if (name === "NoSuchBucket" || code === "NoSuchBucket")
		return "bucket-unavailable-or-not-found";
	return "unexpected-provider-or-api-error";
}

/** @param {unknown} error @returns {string} */
function describeProviderError(error) {
	const candidate =
		/** @type {{name?: unknown, code?: unknown, message?: unknown, $metadata?: {httpStatusCode?: unknown}}} */ (
			error
		);
	const name = typeof candidate.name === "string" ? candidate.name : "Error";
	const code = typeof candidate.code === "string" ? ` code=${candidate.code}` : "";
	const status =
		typeof candidate.$metadata?.httpStatusCode === "number"
			? ` status=${candidate.$metadata.httpStatusCode}`
			: "";
	return `${name}${code}${status} message=${safeMessage(error)}`;
}

/** @param {unknown} error @returns {string} */
function safeMessage(error) {
	const message = error instanceof Error ? error.message : String(error);
	return message
		.replace(/https?:\/\/[^\s]+/giu, "[url-redacted]")
		.replace(
			/(access[_-]?key|secret(?:[_-]?access[_-]?key)?|token|password)\s*[:=]\s*[^\s,;]+/giu,
			"$1=[redacted]",
		);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
	await main();

/** @param {string} bucketName @returns {boolean} */
function isDevelopmentBucketName(bucketName) {
	return /(?:^|[-_])(dev|development|local|test|testing)(?:$|[-_])/iu.test(bucketName);
}
