/* global console */

import { randomUUID } from "node:crypto";
import process from "node:process";
import { pathToFileURL } from "node:url";
import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
} from "@aws-sdk/client-s3";

import { createR2S3Client } from "../src/features/media/storage/r2Storage.js";
import { readCanonicalRegistryConfiguration } from "../src/features/media/registry/r2CanonicalMediaRegistry.js";

const SMOKE_TEST_CONFIRMATION = "I_CONFIRM_DEVELOPMENT_CANONICAL_REGISTRY";

/** @typedef {{send: (command: object) => Promise<unknown>}} S3CommandClient */

/**
 * Read and safety-check configuration for the disposable canonical-registry smoke test.
 * Production-looking buckets and missing explicit confirmation are refused.
 *
 * @param {NodeJS.ProcessEnv} [environment]
 */
export function readCanonicalRegistrySmokeTestConfiguration(environment = process.env) {
	const configuration = readCanonicalRegistryConfiguration(environment);
	if (
		!/(^|[-_])(dev|development|test|staging)([-_]|$)/iu.test(
			configuration.bucketName,
		) ||
		/(^|[-_])(prod|production)([-_]|$)/iu.test(configuration.bucketName)
	)
		throw new Error("Canonical registry smoke test refuses a non-development bucket.");
	if (
		environment.R2_CANONICAL_REGISTRY_SMOKE_TEST_CONFIRMATION !==
		SMOKE_TEST_CONFIRMATION
	)
		throw new Error(
			"Canonical registry smoke test requires explicit development confirmation.",
		);
	return configuration;
}

/**
 * Put, read, validate, delete, and confirm cleanup of one disposable registry object.
 *
 * @param {{client: S3CommandClient, configuration: ReturnType<typeof readCanonicalRegistryConfiguration>, key?: string}} options
 * @returns {Promise<{key: string}>}
 */
export async function runCanonicalRegistrySmokeTest({
	client,
	configuration,
	key = `${configuration.prefix}/_smoke-test/${randomUUID()}.json`,
}) {
	const expected = JSON.stringify({ smokeTest: "lets-flex-canonical-registry" });
	let created = false;
	let operationError;
	let cleanupError;
	try {
		await client.send(
			new PutObjectCommand({
				Bucket: configuration.bucketName,
				Key: key,
				Body: expected,
				ContentType: "application/json",
			}),
		);
		created = true;
		const response =
			/** @type {{Body?: {transformToString?: () => Promise<string>}}} */ (
				await client.send(
					new GetObjectCommand({ Bucket: configuration.bucketName, Key: key }),
				)
			);
		if (!response.Body || typeof response.Body.transformToString !== "function")
			throw new Error("Canonical registry smoke response had no readable body.");
		if ((await response.Body.transformToString()) !== expected)
			throw new Error("Canonical registry smoke test returned unexpected content.");
	} catch (error) {
		operationError = error;
	} finally {
		if (created) cleanupError = await cleanup(client, configuration.bucketName, key);
	}
	if (operationError && cleanupError)
		throw new AggregateError(
			[operationError, cleanupError],
			"Canonical registry smoke test and cleanup failed.",
		);
	if (operationError) throw operationError;
	if (cleanupError) throw cleanupError;
	return { key };
}

/** @param {S3CommandClient} client @param {string} bucketName @param {string} key */
async function cleanup(client, bucketName, key) {
	try {
		await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
		await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
		return new Error("Canonical registry smoke cleanup did not remove its object.");
	} catch (error) {
		return isMissingObjectError(error) ? null : error;
	}
}

/** @param {NodeJS.ProcessEnv} environment */
async function main(environment = process.env) {
	const configuration = readCanonicalRegistrySmokeTestConfiguration(environment);
	const client = createR2S3Client(configuration);
	await runCanonicalRegistrySmokeTest({ client, configuration });
	console.log(
		"Canonical registry development smoke test passed and cleaned up its object.",
	);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
	await main();

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
