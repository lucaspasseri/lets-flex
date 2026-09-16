import process from "node:process";
import { pathToFileURL } from "node:url";

import pool from "../db/pool.js";
import { resetAndSeedDatabase } from "../db/seed.js";
import { verifyCanonicalRegistryRestoration } from "../src/features/media/registry/canonicalMediaRegistryRecovery.js";
import {
	CanonicalMediaDurabilityPreflightError,
	preflightCanonicalMediaDurability,
} from "../src/features/media/registry/canonicalMediaDurabilityPreflight.js";
import { createCanonicalMediaRegistryFromEnvironment } from "../src/features/media/registry/canonicalMediaRegistry.js";
import { readCanonicalRegistryConfiguration } from "../src/features/media/registry/r2CanonicalMediaRegistry.js";
import {
	createR2MediaObjectProbeFromEnvironment,
	readR2ObjectProbeConfiguration,
} from "../src/features/media/storage/r2Storage.js";

const REQUIRED_R2_CONFIGURATION = Object.freeze([
	"R2_BUCKET_NAME",
	"R2_ENDPOINT",
	"R2_ACCESS_KEY_ID",
	"R2_SECRET_ACCESS_KEY",
	"R2_CANONICAL_REGISTRY_BUCKET_NAME",
	"R2_CANONICAL_REGISTRY_PREFIX",
	"R2_CANONICAL_REGISTRY_ACCESS_KEY_ID",
	"R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY",
]);

export class CanonicalMediaRecoveryConfigurationError extends Error {
	/** @param {string} message @param {unknown} [cause] */
	constructor(message, cause) {
		super(message, cause === undefined ? undefined : { cause });
		this.name = "CanonicalMediaRecoveryConfigurationError";
		this.code = "configuration_error";
	}
}

/**
 * Validate the complete CI contract before making any R2 request. Values are checked for
 * presence only; credentials are never returned in diagnostics.
 *
 * @param {NodeJS.ProcessEnv} [environment]
 * @returns {{media: ReturnType<typeof readR2ObjectProbeConfiguration>, registry: ReturnType<typeof readCanonicalRegistryConfiguration>}}
 */
export function readCanonicalMediaRecoveryConfiguration(environment = process.env) {
	const missing = REQUIRED_R2_CONFIGURATION.filter(
		(name) => typeof environment[name] !== "string" || environment[name].trim() === "",
	);
	if (missing.length > 0)
		throw new CanonicalMediaRecoveryConfigurationError(
			`Missing required R2 configuration: ${missing.join(", ")}.`,
		);

	let media;
	let registry;
	try {
		media = readR2ObjectProbeConfiguration(environment);
		registry = readCanonicalRegistryConfiguration(environment);
	} catch (error) {
		throw new CanonicalMediaRecoveryConfigurationError(
			"R2 configuration is invalid.",
			error,
		);
	}
	if (media.bucketName === registry.bucketName)
		throw new CanonicalMediaRecoveryConfigurationError(
			"Production media and canonical registry buckets must be separate.",
		);
	return { media, registry };
}

/**
 * Rehearse database reconstruction against a disposable PostgreSQL target. Production R2 is
 * accessed only through the read-only durability preflight; the validated registry snapshot is
 * then materialized into the disposable database and checked without further R2 writes.
 *
 * @param {{environment?: NodeJS.ProcessEnv, dependencies?: {registry?: object, mediaStorage?: object, resetDatabase?: (options: object) => Promise<unknown>, verifyRestoration?: (input: object) => Promise<{count: number}>, db?: object}, log?: (message: string) => void}} [options]
 * @returns {Promise<{status: "passed", baselineCount: number, registryCount: number, assignmentCount: number, restoredRegistryCount: number}>}
 */
export async function runCanonicalMediaRecoveryRehearsal({
	environment = process.env,
	dependencies = {},
	log = (message) =>
		globalThis.console.log(`[canonical-media-recovery-rehearsal] ${message}`),
} = {}) {
	if (!dependencies.registry || !dependencies.mediaStorage) {
		readCanonicalMediaRecoveryConfiguration(environment);
		log(
			"R2 configuration validated: required media and registry settings are present; credential values withheld",
		);
	}
	const registry =
		dependencies.registry ?? createCanonicalMediaRegistryFromEnvironment(environment);
	const mediaStorage =
		dependencies.mediaStorage ?? createR2MediaObjectProbeFromEnvironment(environment);

	log("read-only production R2 durability preflight started");
	const preflight = await preflightCanonicalMediaDurability({
		registry,
		mediaStorage: /** @type {any} */ (mediaStorage),
	});
	log(
		`read-only preflight passed: ${preflight.summary.baselineCount} baseline object(s), ${preflight.summary.registryCount} registry override(s)`,
	);

	const reset = dependencies.resetDatabase ?? resetAndSeedDatabase;
	await reset({
		connectionString: environment.DATABASE_URL,
		environment,
		canonicalRegistry: registry,
		mediaStorage: /** @type {any} */ (mediaStorage),
		registryPreflight: {
			entries: preflight.registryEntries,
			summary: { count: preflight.registryEntries.length },
		},
	});
	log("disposable PostgreSQL schema, baseline seed, and registry snapshot restored");

	const verify = dependencies.verifyRestoration ?? verifyCanonicalRegistryRestoration;
	const restored = await verify({
		entries: preflight.registryEntries,
		db: dependencies.db ?? pool,
	});
	log(
		`strict post-restore verification passed: ${restored.count} registry override(s)`,
	);

	return {
		status: "passed",
		...preflight.summary,
		restoredRegistryCount: restored.count,
	};
}

async function main() {
	try {
		await runCanonicalMediaRecoveryRehearsal();
	} catch (error) {
		for (const line of formatCanonicalMediaRecoveryFailure(error, process.env))
			globalThis.console.error(line);
		process.exitCode = 1;
	} finally {
		await pool.end();
	}
}

/**
 * Format safe, actionable CI diagnostics without printing any credential contents.
 *
 * @param {unknown} error
 * @param {NodeJS.ProcessEnv} [environment]
 * @returns {Array<string>}
 */
export function formatCanonicalMediaRecoveryFailure(error, environment = process.env) {
	const mediaBucket = safeConfigurationValue(environment.R2_BUCKET_NAME);
	const registryBucket = safeConfigurationValue(
		environment.R2_CANONICAL_REGISTRY_BUCKET_NAME,
	);
	const buckets = `${mediaBucket ? ` mediaBucket=${mediaBucket}` : ""}${registryBucket ? ` registryBucket=${registryBucket}` : ""}`;
	const prefix = `[canonical-media-recovery-rehearsal]${buckets}`;
	if (error instanceof CanonicalMediaRecoveryConfigurationError)
		return [
			`${prefix} category=configuration-error reason=${error.message}`,
			...(error.cause ? [`- detail=${safeMessage(error.cause)}`] : []),
		];
	if (error instanceof CanonicalMediaDurabilityPreflightError) {
		const categoryCounts = new Map();
		for (const issue of error.issues) {
			const category = categorizeDurabilityIssue(issue);
			categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
		}
		const counts = [...categoryCounts]
			.map(([category, count]) => `${category}=${count}`)
			.join(" ");
		return [
			`${prefix} category=canonical-media-durability-preflight-failed issues=${error.issues.length}${counts ? ` ${counts}` : ""}`,
			...error.issues.map((issue) => formatDurabilityIssue(issue)),
		];
	}
	return [
		`${prefix} category=unexpected-provider-or-api-error reason=${safeMessage(error)}`,
	];
}

/** @param {{scope: string, entityType?: string, entityKey?: string, objectKey?: string, reason: string, cause?: unknown}} issue @returns {string} */
function formatDurabilityIssue(issue) {
	const identity = issue.entityType
		? ` entity=${issue.entityType}${issue.entityKey ? `:${issue.entityKey}` : ""}`
		: "";
	const objectKey = issue.objectKey ? ` objectKey=${issue.objectKey}` : "";
	const provider = issue.cause ? ` provider=${describeProviderError(issue.cause)}` : "";
	return `- category=${categorizeDurabilityIssue(issue)} scope=${issue.scope}${identity}${objectKey} reason=${issue.reason}${provider}`;
}

/** @param {{reason: string, cause?: unknown}} issue @returns {string} */
function categorizeDurabilityIssue(issue) {
	if (issue.reason.includes("object is missing")) return "canonical-object-missing";
	if (issue.cause) return categorizeProviderError(issue.cause);
	return "canonical-media-verification-failed";
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

/** @param {unknown} value @returns {string} */
function safeConfigurationValue(value) {
	return typeof value === "string" && value.trim() !== ""
		? value.trim().replace(/\s+/gu, "_")
		: "";
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
