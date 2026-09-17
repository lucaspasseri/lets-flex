import assert from "node:assert/strict";
import test from "node:test";

import {
	createR2CanonicalMediaRegistry,
	readCanonicalRegistryConfiguration,
} from "./r2CanonicalMediaRegistry.js";
import { getR2OperationDiagnostics } from "../storage/r2Storage.js";

const configuration = {
	bucketName: "lets-flex-canonical-registry-dev",
	prefix: "v1",
	endpoint: "https://account.r2.cloudflarestorage.com",
	region: "auto",
	accessKeyId: "registry-access",
	secretAccessKey: "registry-secret",
};
const entry =
	/** @type {import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry} */ ({
		schemaVersion: 1,
		entityType: "exercise",
		entityKey: "push-up",
		role: "canonical",
		asset: {
			objectKey: "assets/b.webp",
			mimeType: "image/webp",
			width: 10,
			height: 20,
		},
		canonicalPath: "/media/catalog/promoted/exercise/push-up-b.webp",
		alt: { en: "Push-up", "pt-BR": "Flexão" },
		updatedAt: "2026-09-16T00:00:00.000Z",
	});

test("registry configuration requires separate registry credentials and shared endpoint", () => {
	assert.deepEqual(
		readCanonicalRegistryConfiguration({
			R2_CANONICAL_REGISTRY_BUCKET_NAME: configuration.bucketName,
			R2_CANONICAL_REGISTRY_PREFIX: configuration.prefix,
			R2_ENDPOINT: configuration.endpoint,
			R2_REGION: configuration.region,
			R2_CANONICAL_REGISTRY_ACCESS_KEY_ID: configuration.accessKeyId,
			R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY: configuration.secretAccessKey,
		}),
		configuration,
	);
	assert.throws(
		() => readCanonicalRegistryConfiguration({ R2_ENDPOINT: configuration.endpoint }),
		/R2_CANONICAL_REGISTRY_BUCKET_NAME is required/,
	);
	assert.throws(
		() =>
			readCanonicalRegistryConfiguration({
				R2_CANONICAL_REGISTRY_BUCKET_NAME: configuration.bucketName,
				R2_CANONICAL_REGISTRY_PREFIX: "v1/../production",
				R2_ENDPOINT: configuration.endpoint,
				R2_CANONICAL_REGISTRY_ACCESS_KEY_ID: "x",
				R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY: "y",
			}),
		/R2_CANONICAL_REGISTRY_PREFIX is unsafe/,
	);
});

test("R2 registry uses private bucket keys and conditional writes", async () => {
	const commands = [];
	const client = {
		async send(command) {
			commands.push(command);
			if (commands.length === 1)
				return {
					Body: { transformToString: async () => JSON.stringify(entry) },
					ETag: '"etag-1"',
				};
			return { ETag: '"etag-2"' };
		},
	};
	const registry = createR2CanonicalMediaRegistry({ configuration, client });

	assert.deepEqual(await registry.getCanonicalOverride("exercise", "push-up"), {
		entry,
		etag: "etag-1",
	});
	await registry.putCanonicalOverride(entry, { expectedEtag: "etag-1" });
	assert.equal(commands[0].input.Bucket, configuration.bucketName);
	assert.equal(commands[0].input.Key, "v1/exercise/push-up.json");
	assert.equal(commands[1].input.IfMatch, '"etag-1"');
	assert.equal(commands[1].input.ContentType, "application/json");
});

test("R2 registry preserves safe diagnostics for list failures", async () => {
	const providerError = Object.assign(
		new Error("getaddrinfo ENOTFOUND account.r2.cloudflarestorage.com"),
		{ code: "ENOTFOUND" },
	);
	const registry = createR2CanonicalMediaRegistry({
		configuration,
		client: {
			async send() {
				throw providerError;
			},
		},
	});

	await assert.rejects(
		() => registry.listCanonicalOverrides(),
		(error) => {
			assert.deepEqual(getR2OperationDiagnostics(error), {
				operation: "ListObjectsV2",
				bucketName: configuration.bucketName,
				endpointHostname: "account.r2.cloudflarestorage.com",
				forcePathStyle: true,
				providerName: "Error",
				providerCode: "ENOTFOUND",
				providerMessage: "getaddrinfo ENOTFOUND account.r2.cloudflarestorage.com",
			});
			return true;
		},
	);
});
