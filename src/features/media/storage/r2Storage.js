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
			try {
				await storageClient.send(
					new HeadObjectCommand({
						Bucket: normalizedBucketName,
						Key: normalizeMediaObjectKey(storageKey),
					}),
				);
				return true;
			} catch (error) {
				if (isMissingObjectError(error)) return false;
				throw error;
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

/** @param {NodeJS.ProcessEnv} environment @param {string} name @returns {string} */
function requiredEnvironmentValue(environment, name) {
	return requiredOption(environment[name], name);
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
	const parsed = new URL(normalizedValue);
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
