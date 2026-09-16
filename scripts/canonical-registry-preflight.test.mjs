import assert from "node:assert/strict";
import test from "node:test";

import { runCanonicalRegistryPreflight } from "./canonical-registry-preflight.mjs";

const entry = {
	schemaVersion: 1,
	entityType: "exercise",
	entityKey: "push-up",
	role: "canonical",
	asset: {
		objectKey: "assets/push-up.webp",
		mimeType: "image/webp",
		width: 1200,
		height: 800,
	},
	canonicalPath: "/media/catalog/exercises/push-up.webp",
	alt: { en: "Push-up", "pt-BR": "Flexão" },
	updatedAt: "2026-09-16T00:00:00.000Z",
};

function registry(overrides = {}) {
	return {
		async listCanonicalOverrides() {
			return [{ entry }];
		},
		...overrides,
	};
}

test("canonical registry preflight has no database or public URL dependency", async () => {
	const logs = [];
	const result = await runCanonicalRegistryPreflight({
		environment: {
			R2_BUCKET_NAME: "media-production",
			R2_ENDPOINT: "https://account.r2.cloudflarestorage.com",
			R2_ACCESS_KEY_ID: "media-access-key",
			R2_SECRET_ACCESS_KEY: "media-secret-key",
			R2_CANONICAL_REGISTRY_BUCKET_NAME: "registry-production",
			R2_CANONICAL_REGISTRY_PREFIX: "v1",
			R2_CANONICAL_REGISTRY_ACCESS_KEY_ID: "registry-access-key",
			R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY: "registry-secret-key",
		},
		dependencies: {
			registry: registry(),
			mediaStorage: { exists: async () => true },
		},
		log: (message) => logs.push(message),
	});

	assert.deepEqual(result, { status: "passed", count: 1 });
	assert.match(logs[0], /passed: 1 canonical registry entry/);
});

test("canonical registry preflight rejects before deployment can continue", async () => {
	await assert.rejects(
		runCanonicalRegistryPreflight({
			dependencies: {
				registry: registry(),
				mediaStorage: { exists: async () => false },
			},
			log: () => {},
		}),
		/Canonical registry preflight failed with 1 issue/,
	);
});
