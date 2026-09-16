import {
	DeleteObjectCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
} from "@aws-sdk/client-s3";

import { createR2S3Client } from "../storage/r2Storage.js";
import {
	canonicalRegistryObjectKey,
	validateCanonicalRegistryEntry,
} from "./canonicalMediaRegistrySchema.js";

/** @typedef {{send: (command: object) => Promise<unknown>}} S3CommandClient */

/**
 * Read private canonical-registry configuration. Registry credentials are intentionally separate
 * from public media credentials, while endpoint and region remain shared R2 settings.
 *
 * @param {NodeJS.ProcessEnv} [environment]
 * @returns {{bucketName: string, prefix: string, endpoint: string, region: string, accessKeyId: string, secretAccessKey: string}}
 */
export function readCanonicalRegistryConfiguration(environment = process.env) {
	const bucketName = requiredValue(
		environment.R2_CANONICAL_REGISTRY_BUCKET_NAME,
		"R2_CANONICAL_REGISTRY_BUCKET_NAME",
	);
	const prefix = requiredPrefix(
		environment.R2_CANONICAL_REGISTRY_PREFIX,
		"R2_CANONICAL_REGISTRY_PREFIX",
	);
	const endpoint = requiredHttpsUrl(environment.R2_ENDPOINT, "R2_ENDPOINT");
	const accessKeyId = requiredValue(
		environment.R2_CANONICAL_REGISTRY_ACCESS_KEY_ID,
		"R2_CANONICAL_REGISTRY_ACCESS_KEY_ID",
	);
	const secretAccessKey = requiredValue(
		environment.R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY,
		"R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY",
	);
	return {
		bucketName,
		prefix,
		endpoint,
		region: environment.R2_REGION?.trim() || "auto",
		accessKeyId,
		secretAccessKey,
	};
}

/**
 * Create a private registry object adapter. The adapter returns ETags to its domain boundary so
 * callers can use conditional writes for one entity without introducing distributed locking.
 *
 * @param {{configuration: ReturnType<typeof readCanonicalRegistryConfiguration>, client?: S3CommandClient}} options
 */
export function createR2CanonicalMediaRegistry({ configuration, client }) {
	const storageClient =
		client ??
		createR2S3Client({
			endpoint: configuration.endpoint,
			region: configuration.region,
			accessKeyId: configuration.accessKeyId,
			secretAccessKey: configuration.secretAccessKey,
		});
	const prefix = configuration.prefix.replace(/\/$/u, "");

	return {
		/** @param {string} entityType @param {string} entityKey */
		async getCanonicalOverride(entityType, entityKey) {
			const key = objectKey(prefix, entityType, entityKey);
			try {
				const result = await readEntryAtKey(key);
				const entry = result.entry;
				if (entry.entityType !== entityType || entry.entityKey !== entityKey)
					throw new Error("Registry object identity does not match its key.");
				return result;
			} catch (error) {
				if (isMissingObjectError(error)) return null;
				throw error;
			}
		},
		/** @param {import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry} entry @param {{expectedEtag?: string | null}} [options] */
		async putCanonicalOverride(entry, options = {}) {
			const validated = validateCanonicalRegistryEntry(entry);
			const key = objectKey(prefix, validated.entityType, validated.entityKey);
			const input = {
				Bucket: configuration.bucketName,
				Key: key,
				Body: `${JSON.stringify(validated)}\n`,
				ContentType: "application/json",
				...(options.expectedEtag
					? { IfMatch: quoteEtag(options.expectedEtag) }
					: { IfNoneMatch: "*" }),
			};
			const response = /** @type {{ETag?: string}} */ (
				await storageClient.send(new PutObjectCommand(input))
			);
			return { entry: validated, etag: cleanEtag(response.ETag) };
		},
		/** @param {string} entityType @param {string} entityKey @param {{expectedEtag?: string}} [options] */
		async deleteCanonicalOverride(entityType, entityKey, options) {
			await storageClient.send(
				new DeleteObjectCommand({
					Bucket: configuration.bucketName,
					Key: objectKey(prefix, entityType, entityKey),
					...(options?.expectedEtag
						? { IfMatch: quoteEtag(options.expectedEtag) }
						: {}),
				}),
			);
		},
		async listCanonicalOverrides() {
			const entries = [];
			let continuationToken;
			do {
				const response =
					/** @type {{Contents?: Array<{Key?: string}> , IsTruncated?: boolean, NextContinuationToken?: string}} */ (
						await storageClient.send(
							new ListObjectsV2Command({
								Bucket: configuration.bucketName,
								Prefix: `${prefix}/`,
								...(continuationToken ? { ContinuationToken: continuationToken } : {}),
							}),
						)
					);
				for (const object of response.Contents ?? []) {
					if (typeof object.Key !== "string") continue;
					if (object.Key.startsWith(`${prefix}/_smoke-test/`)) continue;
					if (!object.Key.endsWith(".json"))
						throw new Error(`Unexpected canonical registry object key: ${object.Key}`);
					const match = object.Key.match(
						new RegExp(`^${escapeRegExp(prefix)}/([^/]+)/([^/]+)\\.json$`),
					);
					if (!match)
						throw new Error(`Unexpected canonical registry object key: ${object.Key}`);
					const result = await readEntryAtKey(object.Key);
					if (
						result.entry.entityType !== match[1] ||
						result.entry.entityKey !== match[2]
					)
						throw new Error(
							"Canonical registry object identity does not match its key.",
						);
					entries.push(result);
				}
				continuationToken = response.IsTruncated
					? response.NextContinuationToken
					: undefined;
			} while (continuationToken);
			return entries;
		},
	};

	/** @param {string} key */
	async function readEntryAtKey(key) {
		const response = /** @type {{Body?: unknown, ETag?: string}} */ (
			await storageClient.send(
				new GetObjectCommand({
					Bucket: configuration.bucketName,
					Key: key,
				}),
			)
		);
		return {
			entry: validateCanonicalRegistryEntry(
				JSON.parse(await bodyToString(response.Body)),
			),
			etag: cleanEtag(response.ETag),
		};
	}
}

/** @param {NodeJS.ProcessEnv} [environment] @param {{client?: S3CommandClient}} [options] */
export function createR2CanonicalMediaRegistryFromEnvironment(
	environment = process.env,
	options = {},
) {
	return createR2CanonicalMediaRegistry({
		configuration: readCanonicalRegistryConfiguration(environment),
		...options,
	});
}

/** @param {string} prefix @param {string} entityType @param {string} entityKey */
function objectKey(prefix, entityType, entityKey) {
	return canonicalRegistryObjectKey(
		/** @type {import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntityType} */ (
			entityType
		),
		entityKey,
		prefix,
	);
}

/** @param {unknown} body @returns {Promise<string>} */
async function bodyToString(body) {
	if (!body) throw new Error("Canonical registry object response had no body.");
	const candidate = /** @type {{transformToString?: () => Promise<string>}} */ (body);
	if (typeof candidate.transformToString === "function")
		return candidate.transformToString();
	const chunks = [];
	for await (const chunk of /** @type {AsyncIterable<Uint8Array>} */ (body))
		chunks.push(Buffer.from(chunk));
	return Buffer.concat(chunks).toString("utf8");
}

/** @param {unknown} value @returns {string | undefined} */
function cleanEtag(value) {
	return typeof value === "string" ? value.replace(/^"|"$/gu, "") : undefined;
}

/** @param {string} value @returns {string} */
function quoteEtag(value) {
	return `"${value.replaceAll('"', "")}"`;
}

/** @param {unknown} error @returns {boolean} */
function isMissingObjectError(error) {
	const candidate =
		/** @type {{name?: string, $metadata?: {httpStatusCode?: number}}} */ (error);
	return (
		candidate?.name === "NotFound" ||
		candidate?.name === "NoSuchKey" ||
		candidate?.$metadata?.httpStatusCode === 404
	);
}

/** @param {string} value @returns {string} */
function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

/** @param {unknown} value @param {string} name @returns {string} */
function requiredValue(value, name) {
	if (typeof value !== "string" || value.trim() === "")
		throw new Error(`${name} is required.`);
	return value.trim();
}

/** @param {unknown} value @param {string} name @returns {string} */
function requiredPrefix(value, name) {
	const prefix = requiredValue(value, name).replace(/^\/|\/$/gu, "");
	if (
		prefix.includes("..") ||
		prefix.includes("\\") ||
		prefix.split("/").some((segment) => segment === "")
	)
		throw new Error(`${name} is unsafe.`);
	return prefix;
}

/** @param {unknown} value @param {string} name @returns {string} */
function requiredHttpsUrl(value, name) {
	const raw = requiredValue(value, name);
	const url = new URL(raw);
	if (
		url.protocol !== "https:" ||
		url.username ||
		url.password ||
		url.search ||
		url.hash
	)
		throw new Error(
			`${name} must be an HTTPS URL without credentials, query, or fragment.`,
		);
	return url.toString().replace(/\/$/u, "");
}
