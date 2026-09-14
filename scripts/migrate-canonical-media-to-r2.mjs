/* global Buffer, console */

import process from "node:process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

import { createCanonicalMediaManifestStore } from "../src/features/media/canonicalMediaManifestStore.js";
import { migrateCanonicalMedia } from "../src/features/media/storage/migrateCanonicalMedia.js";
import { readR2SmokeTestConfiguration } from "./r2-smoke-test.mjs";

/** @typedef {{send: (command: object) => Promise<unknown>}} S3CommandClient */

/**
 * Create the exact-key byte operations needed by the development import. The command is kept
 * separate from the application adapter because it must repair a known mapped key and does not
 * need public URL configuration.
 *
 * @param {{client: S3CommandClient, bucketName: string}} options
 */
function createR2MigrationStorage({ client, bucketName }) {
	return {
		async put(buffer, { storageKey, contentType }) {
			await client.send(
				new PutObjectCommand({
					Bucket: bucketName,
					Key: storageKey,
					Body: buffer,
					ContentType: contentType,
				}),
			);
		},
		async delete(storageKey) {
			await client.send(
				new DeleteObjectCommand({ Bucket: bucketName, Key: storageKey }),
			);
		},
		async exists(storageKey) {
			try {
				await client.send(
					new HeadObjectCommand({ Bucket: bucketName, Key: storageKey }),
				);
				return true;
			} catch (error) {
				if (isMissingObjectError(error)) return false;
				throw error;
			}
		},
		async read(storageKey) {
			const response =
				/** @type {{Body?: {transformToByteArray?: () => Promise<Uint8Array>}}} */ (
					await client.send(
						new GetObjectCommand({ Bucket: bucketName, Key: storageKey }),
					)
				);
			if (!response.Body || typeof response.Body.transformToByteArray !== "function") {
				throw new Error(
					"R2 canonical media migration response did not include a readable body.",
				);
			}
			return Buffer.from(await response.Body.transformToByteArray());
		},
	};
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
	const repositoryRoot = path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		"..",
	);
	const manifestStore = createCanonicalMediaManifestStore({
		filePath: path.join(repositoryRoot, "data/canonical-media.json"),
	});
	const result = await migrateCanonicalMedia({
		manifestStore,
		storage: createR2MigrationStorage({
			client,
			bucketName: configuration.bucketName,
		}),
		publicDirectory: path.join(repositoryRoot, "public"),
	});
	console.log(
		`Canonical media migration passed for development bucket ${configuration.bucketName}: ${result.total} verified, ${result.uploaded} uploaded, ${result.reused} already matching.`,
	);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
	await main();
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
