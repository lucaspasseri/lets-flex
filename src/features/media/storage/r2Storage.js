import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import {
	createPublicMediaObjectKey,
	normalizeMediaObjectKey,
} from "./mediaObjectKey.js";

/** @typedef {import("./storage.js").MediaStorage} MediaStorage */

/** @typedef {{send: (command: object) => Promise<unknown>}} S3CommandClient */

/** @typedef {{exists: (storageKey: string) => Promise<boolean>}} MediaObjectProbe */

export class R2OperationError extends Error {
	/** @param {{operation: string, bucketName: string, endpoint?: string, objectKey?: string}} context @param {unknown} cause */
	constructor(context, cause) {
		super(
			`R2 ${context.operation} failed for bucket ${context.bucketName}${context.objectKey ? ` and object ${context.objectKey}` : ""}.`,
			{ cause },
		);
		this.name = "R2OperationError";
		this.operation = context.operation;
		this.bucketName = context.bucketName;
		this.endpointHostname = getEndpointHostname(context.endpoint);
		this.forcePathStyle = true;
		if (context.objectKey) this.objectKey = context.objectKey;
	}
}

export class R2ObjectMissingError extends R2OperationError {
	/** @param {{operation: string, bucketName: string, endpoint?: string, objectKey?: string}} context @param {unknown} cause */
	constructor(context, cause) {
		super(context, cause);
		this.name = "R2ObjectMissingError";
		this.objectMissing = true;
	}
}

/**
 * Return safe request/provider details for operational diagnostics. The returned message is
 * scrubbed so provider errors cannot expose signed URLs or credential-like values.
 *
 * @param {unknown} error
 * @returns {{operation: string, bucketName: string, endpointHostname: string, forcePathStyle: boolean, objectKey?: string, objectMissing?: boolean, providerName: string, providerCode?: string, httpStatusCode?: number, providerMessage: string} | null}
 */
export function getR2OperationDiagnostics(error) {
	const operationError = findR2OperationError(error);
	if (!operationError) return null;
	const provider = operationError.cause;
	const candidate =
		/** @type {{name?: unknown, code?: unknown, message?: unknown, $metadata?: {httpStatusCode?: unknown}}} */ (
			provider
		);
	const providerName = typeof candidate?.name === "string" ? candidate.name : "Error";
	const providerCode = typeof candidate?.code === "string" ? candidate.code : undefined;
	const httpStatusCode =
		typeof candidate?.$metadata?.httpStatusCode === "number"
			? candidate.$metadata.httpStatusCode
			: undefined;
	return {
		operation: operationError.operation,
		bucketName: operationError.bucketName,
		endpointHostname: operationError.endpointHostname,
		forcePathStyle: operationError.forcePathStyle,
		...(operationError.objectKey ? { objectKey: operationError.objectKey } : {}),
		...(isObjectMissingError(operationError) ? { objectMissing: true } : {}),
		providerName,
		...(providerCode ? { providerCode } : {}),
		...(httpStatusCode !== undefined ? { httpStatusCode } : {}),
		providerMessage: sanitizeProviderMessage(
			typeof candidate?.message === "string" ? candidate.message : provider,
		),
	};
}

/**
 * Read the server-side R2 configuration without exposing secret values in errors or logs.
 *
 * @param {NodeJS.ProcessEnv} [environment]
 * @returns {{bucketName: string, endpoint: string, region: string, accessKeyId: string, secretAccessKey: string, publicUrlBase: string}}
 */
export function readR2Configuration(environment = process.env) {
	const bucketName = requiredEnvironmentValue(environment, "R2_BUCKET_NAME");
	const endpoint = requiredEnvironmentValue(environment, "R2_ENDPOINT");
	const accessKeyId = requiredEnvironmentValue(environment, "R2_ACCESS_KEY_ID");
	const secretAccessKey = requiredEnvironmentValue(environment, "R2_SECRET_ACCESS_KEY");
	const publicUrlBase = requiredEnvironmentValue(environment, "MEDIA_PUBLIC_URL");
	const region = environment.R2_REGION?.trim() || "auto";

	assertHttpUrl(endpoint, "R2_ENDPOINT");
	assertHttpUrl(publicUrlBase, "MEDIA_PUBLIC_URL");

	return {
		bucketName,
		endpoint,
		region,
		accessKeyId,
		secretAccessKey,
		publicUrlBase,
	};
}

/**
 * Read only the R2 settings needed to verify that an existing media object is present. This
 * intentionally excludes MEDIA_PUBLIC_URL because object-existence checks do not construct URLs.
 *
 * @param {NodeJS.ProcessEnv} [environment]
 * @returns {{bucketName: string, endpoint: string, region: string, accessKeyId: string, secretAccessKey: string}}
 */
export function readR2ObjectProbeConfiguration(environment = process.env) {
	const bucketName = requiredEnvironmentValue(environment, "R2_BUCKET_NAME");
	const endpoint = requiredEnvironmentValue(environment, "R2_ENDPOINT");
	const accessKeyId = requiredEnvironmentValue(environment, "R2_ACCESS_KEY_ID");
	const secretAccessKey = requiredEnvironmentValue(environment, "R2_SECRET_ACCESS_KEY");
	const region = environment.R2_REGION?.trim() || "auto";

	assertHttpUrl(endpoint, "R2_ENDPOINT");
	return { bucketName, endpoint, region, accessKeyId, secretAccessKey };
}

/**
 * Refuse a development/test reset that could read a production-scoped R2 resource. The selected
 * bucket remains R2_BUCKET_NAME; R2_DEVELOPMENT_BUCKET_NAME is the explicit development safety
 * reference used to detect local configuration drift.
 *
 * @param {NodeJS.ProcessEnv} [environment]
 */
export function assertDevelopmentR2Configuration(environment = process.env) {
	if (environment.NODE_ENV !== "development" && environment.NODE_ENV !== "test") return;

	const selectedMediaBucket = environment.R2_BUCKET_NAME?.trim();
	const developmentMediaBucket = environment.R2_DEVELOPMENT_BUCKET_NAME?.trim();
	const registryBucket = environment.R2_CANONICAL_REGISTRY_BUCKET_NAME?.trim();
	if (developmentMediaBucket && !isDevelopmentBucketName(developmentMediaBucket))
		throw new Error(
			"Development R2 configuration requires R2_DEVELOPMENT_BUCKET_NAME to be development-scoped.",
		);
	if (
		selectedMediaBucket &&
		developmentMediaBucket &&
		selectedMediaBucket !== developmentMediaBucket
	)
		throw new Error(
			`Development R2 configuration requires R2_BUCKET_NAME to match R2_DEVELOPMENT_BUCKET_NAME; selected=${selectedMediaBucket} development=${developmentMediaBucket}.`,
		);
	if (selectedMediaBucket && !isDevelopmentBucketName(selectedMediaBucket))
		throw new Error(
			`Development R2 configuration refuses a production-scoped R2_BUCKET_NAME; selected=${selectedMediaBucket}.`,
		);
	if (registryBucket && !isDevelopmentBucketName(registryBucket))
		throw new Error(
			`Development R2 configuration refuses a production-scoped canonical registry bucket; selected=${registryBucket}.`,
		);
}

/**
 * Create a read-only adapter for checking existing R2 media objects.
 *
 * @param {{client?: S3CommandClient, bucketName: string, endpoint?: string, region?: string, accessKeyId?: string, secretAccessKey?: string, throwOnMissing?: boolean}} options
 * @returns {MediaObjectProbe}
 */
export function createR2MediaObjectProbe({
	client,
	bucketName,
	endpoint,
	region = "auto",
	accessKeyId,
	secretAccessKey,
	throwOnMissing = false,
}) {
	const normalizedBucketName = requiredOption(bucketName, "R2 bucket name");
	const normalizedEndpoint = endpoint
		? assertHttpUrl(endpoint, "R2 endpoint")
		: undefined;
	const storageClient =
		client ??
		createR2S3Client({
			endpoint: normalizedEndpoint,
			region,
			accessKeyId,
			secretAccessKey,
		});

	return {
		/** @param {string} storageKey */
		async exists(storageKey) {
			const objectKey = normalizeMediaObjectKey(storageKey);
			try {
				await storageClient.send(
					new HeadObjectCommand({
						Bucket: normalizedBucketName,
						Key: objectKey,
					}),
				);
				return true;
			} catch (error) {
				if (isMissingObjectError(error)) {
					if (throwOnMissing)
						throw new R2ObjectMissingError(
							{
								operation: "HeadObject",
								bucketName: normalizedBucketName,
								endpoint: normalizedEndpoint,
								objectKey,
							},
							error,
						);
					return false;
				}
				throw asR2OperationError(error, {
					operation: "HeadObject",
					bucketName: normalizedBucketName,
					endpoint: normalizedEndpoint,
					objectKey,
				});
			}
		},
	};
}

/**
 * Create an S3-compatible storage adapter for Cloudflare R2.
 *
 * New objects use the provider-neutral `assets/<generated-id>.<extension>` strategy. Existing
 * legacy `/media/...` keys remain a migration concern and are not renamed here.
 *
 * @param {{client?: S3CommandClient, bucketName: string, endpoint?: string, region?: string, accessKeyId?: string, secretAccessKey?: string, publicUrlBase: string}} options
 * @returns {MediaStorage}
 */
export function createR2MediaStorage({
	client,
	bucketName,
	endpoint,
	region = "auto",
	accessKeyId,
	secretAccessKey,
	publicUrlBase,
}) {
	const normalizedBucketName = requiredOption(bucketName, "R2 bucket name");
	const normalizedEndpoint = endpoint
		? assertHttpUrl(endpoint, "R2 endpoint")
		: undefined;
	const normalizedPublicUrlBase = assertHttpUrl(publicUrlBase, "Media public URL");

	const storageClient =
		client ??
		createR2S3Client({
			endpoint: normalizedEndpoint,
			region,
			accessKeyId,
			secretAccessKey,
		});

	return /** @type {MediaStorage} */ ({
		/** @param {Buffer} buffer @param {{extension: string, filename?: string, contentType?: string}} metadata */
		async put(buffer, { extension, contentType }) {
			if (!Buffer.isBuffer(buffer))
				throw new TypeError("Media storage input must be a Buffer.");
			const key = createPublicMediaObjectKey({ extension });
			const input = {
				Bucket: normalizedBucketName,
				Key: key,
				Body: buffer,
				...(contentType ? { ContentType: contentType } : {}),
			};
			await storageClient.send(new PutObjectCommand(input));
			return { storageKey: key };
		},
		/** @param {string} storageKey */
		async delete(storageKey) {
			await storageClient.send(
				new DeleteObjectCommand({
					Bucket: normalizedBucketName,
					Key: normalizeMediaObjectKey(storageKey),
				}),
			);
		},
		/** @param {string} storageKey */
		async exists(storageKey) {
			const objectKey = normalizeMediaObjectKey(storageKey);
			try {
				await storageClient.send(
					new HeadObjectCommand({
						Bucket: normalizedBucketName,
						Key: objectKey,
					}),
				);
				return true;
			} catch (error) {
				if (isMissingObjectError(error)) return false;
				throw asR2OperationError(error, {
					operation: "HeadObject",
					bucketName: normalizedBucketName,
					endpoint: normalizedEndpoint,
					objectKey,
				});
			}
		},
		/** @param {string} storageKey */
		async read(storageKey) {
			const response = /** @type {{Body?: unknown}} */ (
				await storageClient.send(
					new GetObjectCommand({
						Bucket: normalizedBucketName,
						Key: normalizeMediaObjectKey(storageKey),
					}),
				)
			);
			return bodyToBuffer(response.Body);
		},
		/** @param {string} storageKey */
		getPublicUrl(storageKey) {
			const encodedKey = normalizeMediaObjectKey(storageKey)
				.split("/")
				.map((segment) => encodeURIComponent(segment))
				.join("/");
			return `${normalizedPublicUrlBase}/${encodedKey}`;
		},
	});
}

/**
 * Create the shared S3-compatible client used by R2-backed application boundaries. The caller
 * chooses the bucket and may use separate credentials for private registry metadata.
 *
 * @param {{endpoint?: string, region?: string, accessKeyId?: string, secretAccessKey?: string}} options
 * @returns {S3CommandClient}
 */
export function createR2S3Client({
	endpoint,
	region = "auto",
	accessKeyId,
	secretAccessKey,
}) {
	return /** @type {S3CommandClient} */ (
		new S3Client({
			region,
			...(endpoint ? { endpoint } : {}),
			// Cloudflare R2 account endpoints require the bucket in the path rather than
			// as a virtual-host prefix (for example, bucket.account.r2...).
			forcePathStyle: true,
			credentials: {
				accessKeyId: requiredOption(accessKeyId, "R2 access key ID"),
				secretAccessKey: requiredOption(secretAccessKey, "R2 secret access key"),
			},
		})
	);
}

/**
 * Build an R2 adapter from environment configuration. This factory is intentionally separate from
 * application composition so tests and later provider-selection work can inject a fake client.
 *
 * @param {NodeJS.ProcessEnv} [environment]
 * @param {{client?: S3CommandClient}} [options]
 * @returns {MediaStorage}
 */
export function createR2MediaStorageFromEnvironment(
	environment = process.env,
	options = {},
) {
	return createR2MediaStorage({ ...readR2Configuration(environment), ...options });
}

/**
 * Build the read-only media object probe used by canonical registry preflight.
 *
 * @param {NodeJS.ProcessEnv} [environment]
 * @param {{client?: S3CommandClient, throwOnMissing?: boolean}} [options]
 * @returns {MediaObjectProbe}
 */
export function createR2MediaObjectProbeFromEnvironment(
	environment = process.env,
	options = {},
) {
	return createR2MediaObjectProbe({
		...readR2ObjectProbeConfiguration(environment),
		...options,
	});
}

/**
 * Create the explicitly invoked baseline-provisioning adapter. Its write operation uses a
 * conditional create so an existing object can never be overwritten by this workflow.
 *
 * @param {{client?: S3CommandClient, bucketName: string, endpoint?: string, region?: string, accessKeyId?: string, secretAccessKey?: string}} options
 * @returns {{read: (storageKey: string) => Promise<Buffer | null>, inspect: (storageKey: string) => Promise<{bytes: Buffer, contentType?: string, contentLength?: number, etag?: string, lastModified?: Date} | null>, putIfAbsent: (storageKey: string, bytes: Buffer, metadata: {contentType: string}) => Promise<void>}}
 */
export function createR2MediaBaselineObjectStore({
	client,
	bucketName,
	endpoint,
	region = "auto",
	accessKeyId,
	secretAccessKey,
}) {
	const normalizedBucketName = requiredOption(bucketName, "R2 bucket name");
	const normalizedEndpoint = endpoint
		? assertHttpUrl(endpoint, "R2 endpoint")
		: undefined;
	const storageClient =
		client ??
		createR2S3Client({
			endpoint: normalizedEndpoint,
			region,
			accessKeyId,
			secretAccessKey,
		});

	return {
		/** @param {string} storageKey */
		async read(storageKey) {
			const object = await this.inspect(storageKey);
			return object?.bytes ?? null;
		},
		/** @param {string} storageKey */
		async inspect(storageKey) {
			const objectKey = normalizeMediaObjectKey(storageKey);
			try {
				const response =
					/** @type {{Body?: unknown, ContentType?: string, ContentLength?: number, ETag?: string, LastModified?: Date}} */ (
						await storageClient.send(
							new GetObjectCommand({
								Bucket: normalizedBucketName,
								Key: objectKey,
							}),
						)
					);
				return {
					bytes: await bodyToBuffer(response.Body),
					...(response.ContentType ? { contentType: response.ContentType } : {}),
					...(typeof response.ContentLength === "number"
						? { contentLength: response.ContentLength }
						: {}),
					...(response.ETag ? { etag: response.ETag } : {}),
					...(response.LastModified ? { lastModified: response.LastModified } : {}),
				};
			} catch (error) {
				if (isMissingObjectError(error)) return null;
				throw asR2OperationError(error, {
					operation: "GetObject",
					bucketName: normalizedBucketName,
					endpoint: normalizedEndpoint,
					objectKey,
				});
			}
		},
		/** @param {string} storageKey @param {Buffer} bytes @param {{contentType: string}} metadata */
		async putIfAbsent(storageKey, bytes, metadata) {
			await storageClient.send(
				new PutObjectCommand({
					Bucket: normalizedBucketName,
					Key: normalizeMediaObjectKey(storageKey),
					Body: bytes,
					ContentType: metadata.contentType,
					IfNoneMatch: "*",
				}),
			);
		},
	};
}

/** @param {NodeJS.ProcessEnv} environment @param {string} name @returns {string} */
function requiredEnvironmentValue(environment, name) {
	return requiredOption(environment[name], name);
}

/** @param {unknown} error @param {{operation: string, bucketName: string, endpoint?: string, objectKey?: string}} context @returns {R2OperationError} */
function asR2OperationError(error, context) {
	if (error instanceof R2OperationError) return error;
	return new R2OperationError(context, error);
}

/** @param {unknown} error @returns {R2OperationError | null} */
function findR2OperationError(error) {
	if (error instanceof R2OperationError) return error;
	const cause = /** @type {{cause?: unknown}} */ (error)?.cause;
	return cause && cause !== error ? findR2OperationError(cause) : null;
}

/** @param {R2OperationError} error @returns {boolean} */
function isObjectMissingError(error) {
	return "objectMissing" in error && error.objectMissing === true;
}

/** @param {unknown} endpoint @returns {string} */
function getEndpointHostname(endpoint) {
	if (typeof endpoint !== "string") return "unknown";
	try {
		return new URL(endpoint).hostname || "unknown";
	} catch {
		return "unknown";
	}
}

/** @param {unknown} value @returns {string} */
function sanitizeProviderMessage(value) {
	return String(value)
		.replace(/https?:\/\/[^\s]+/giu, "[url-redacted]")
		.replace(
			/(access[_-]?key|secret(?:[_-]?access[_-]?key)?|token|password)\s*[:=]\s*[^\s,;]+/giu,
			"$1=[redacted]",
		);
}

/** @param {string} bucketName @returns {boolean} */
function isDevelopmentBucketName(bucketName) {
	return (
		/(^|[-_])(dev|development|local|test|testing)([-_]|$)/iu.test(bucketName) &&
		!/(^|[-_])(prod|production)([-_]|$)/iu.test(bucketName)
	);
}

/** @param {unknown} value @param {string} label @returns {string} */
function requiredOption(value, label) {
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error(`${label} is required.`);
	}
	return value.trim();
}

/** @param {string} value @param {string} label @returns {string} */
function assertHttpUrl(value, label) {
	const normalizedValue = requiredOption(value, label);
	let parsed;
	try {
		parsed = new URL(normalizedValue);
	} catch {
		throw new Error(
			`${label} must be an HTTP(S) URL without credentials, query, or fragment.`,
		);
	}
	if (
		!/^https?:$/u.test(parsed.protocol) ||
		parsed.username ||
		parsed.password ||
		parsed.search ||
		parsed.hash
	) {
		throw new Error(
			`${label} must be an HTTP(S) URL without credentials, query, or fragment.`,
		);
	}
	return parsed.toString().replace(/\/$/u, "");
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

/** @param {unknown} body @returns {Promise<Buffer>} */
async function bodyToBuffer(body) {
	if (!body) throw new Error("R2 object response did not include a body.");
	const streamBody = /** @type {{transformToByteArray?: () => Promise<Uint8Array>}} */ (
		body
	);
	if (typeof streamBody.transformToByteArray === "function") {
		return Buffer.from(await streamBody.transformToByteArray());
	}

	const chunks = [];
	for await (const chunk of /** @type {AsyncIterable<Uint8Array>} */ (body)) {
		chunks.push(Buffer.from(chunk));
	}
	return Buffer.concat(chunks);
}
