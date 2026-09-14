/* global console */

import process from "node:process";
import { URL, pathToFileURL } from "node:url";
import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const SMOKE_TEST_CONFIRMATION = "I_CONFIRM_DEVELOPMENT_BUCKET";

/** @typedef {{send: (command: object) => Promise<unknown>}} S3CommandClient */

/**
 * Read and safety-check the configuration for the disposable R2 smoke test.
 *
 * @param {NodeJS.ProcessEnv} [environment]
 * @returns {{bucketName: string, endpoint: string, region: string, accessKeyId: string, secretAccessKey: string}}
 */
export function readR2SmokeTestConfiguration(environment = process.env) {
	const bucketName = requiredValue(environment.R2_BUCKET_NAME, "R2_BUCKET_NAME");
	const developmentBucketName = requiredValue(
		environment.R2_DEVELOPMENT_BUCKET_NAME,
		"R2_DEVELOPMENT_BUCKET_NAME",
	);
	if (bucketName !== developmentBucketName) {
		throw new Error("R2 smoke test requires the selected development bucket.");
	}
	if (!isDevelopmentBucketName(bucketName)) {
		throw new Error(
			"R2 smoke test refuses a bucket without a development-scoped name.",
		);
	}
	if (environment.R2_SMOKE_TEST_CONFIRMATION !== SMOKE_TEST_CONFIRMATION) {
		throw new Error("R2 smoke test requires explicit development-bucket confirmation.");
	}

	return {
		bucketName,
		endpoint: assertHttpsUrl(environment.R2_ENDPOINT, "R2_ENDPOINT"),
		region: environment.R2_REGION?.trim() || "auto",
		accessKeyId: requiredValue(environment.R2_ACCESS_KEY_ID, "R2_ACCESS_KEY_ID"),
		secretAccessKey: requiredValue(
			environment.R2_SECRET_ACCESS_KEY,
			"R2_SECRET_ACCESS_KEY",
		),
	};
}

/**
 * Put, fetch, validate, and delete one disposable object.
 *
 * @param {{client: S3CommandClient, configuration: ReturnType<typeof readR2SmokeTestConfiguration>, key?: string}} options
 * @returns {Promise<{key: string}>}
 */
export async function runR2SmokeTest({
	client,
	configuration,
	key = `_smoke-tests/${randomUUID()}.txt`,
}) {
	const expected = "Let's Flex R2 smoke test";
	let created = false;
	let operationError;
	let cleanupError;
	/** @type {{key: string} | undefined} */
	let result;
	try {
		await client.send(
			new PutObjectCommand({
				Bucket: configuration.bucketName,
				Key: key,
				Body: expected,
				ContentType: "text/plain",
			}),
		);
		created = true;

		const response =
			/** @type {{Body?: {transformToString?: () => Promise<string>}}} */ (
				await client.send(
					new GetObjectCommand({
						Bucket: configuration.bucketName,
						Key: key,
					}),
				)
			);
		if (!response.Body || typeof response.Body.transformToString !== "function") {
			throw new Error("R2 smoke test response did not include a readable body.");
		}
		const actual = await response.Body.transformToString();
		if (actual !== expected) throw new Error("R2 returned unexpected content.");
		result = { key };
	} catch (error) {
		operationError = error;
	} finally {
		if (created) {
			cleanupError = await cleanupR2SmokeTestObject(
				client,
				configuration.bucketName,
				key,
			);
		}
	}
	if (operationError && cleanupError) {
		throw new AggregateError(
			[operationError, cleanupError],
			"R2 smoke test failed and cleanup failed.",
		);
	}
	if (operationError) throw operationError;
	if (cleanupError) throw cleanupError;
	if (!result) throw new Error("R2 smoke test did not complete.");
	return result;
}

/**
 * Delete the disposable object and confirm that a subsequent HEAD reports it missing. Errors are
 * returned so callers can report both the operation and cleanup failure without throwing in finally.
 *
 * @param {S3CommandClient} client
 * @param {string} bucketName
 * @param {string} key
 * @returns {Promise<unknown | null>}
 */
async function cleanupR2SmokeTestObject(client, bucketName, key) {
	try {
		await client.send(
			new DeleteObjectCommand({
				Bucket: bucketName,
				Key: key,
			}),
		);
	} catch (error) {
		return error;
	}

	try {
		await client.send(
			new HeadObjectCommand({
				Bucket: bucketName,
				Key: key,
			}),
		);
		return new Error("R2 smoke test cleanup did not remove the disposable object.");
	} catch (error) {
		return isMissingObjectError(error) ? null : error;
	}
}

/** @param {NodeJS.ProcessEnv} environment @returns {Promise<void>} */
async function main(environment = process.env) {
	const configuration = readR2SmokeTestConfiguration(environment);
	const client = /** @type {S3CommandClient} */ (
		new S3Client({
			region: configuration.region,
			endpoint: configuration.endpoint,
			credentials: {
				accessKeyId: configuration.accessKeyId,
				secretAccessKey: configuration.secretAccessKey,
			},
		})
	);
	await runR2SmokeTest({ client, configuration });
	console.log("R2 development smoke test passed and cleaned up its disposable object.");
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
	await main();
}

/** @param {unknown} value @param {string} name @returns {string} */
function requiredValue(value, name) {
	if (typeof value !== "string" || value.trim() === "")
		throw new Error(`${name} is required.`);
	return value.trim();
}

/** @param {string} bucketName @returns {boolean} */
function isDevelopmentBucketName(bucketName) {
	return (
		/(^|[-_])(dev|development|test|staging)([-_]|$)/iu.test(bucketName) &&
		!/(^|[-_])(prod|production)([-_]|$)/iu.test(bucketName)
	);
}

/** @param {unknown} value @param {string} name @returns {string} */
function assertHttpsUrl(value, name) {
	const url = new URL(requiredValue(value, name));
	if (
		url.protocol !== "https:" ||
		url.username ||
		url.password ||
		url.search ||
		url.hash
	) {
		throw new Error(
			`${name} must be an HTTPS URL without credentials, query, or fragment.`,
		);
	}
	return url.toString().replace(/\/$/u, "");
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
