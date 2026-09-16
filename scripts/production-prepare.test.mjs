import assert from "node:assert/strict";
import test from "node:test";

import {
	PRODUCTION_DATABASE_RESET_AUTHORIZATION,
	PRODUCTION_DATABASE_RESET_MODE,
	prepareProductionDeployment,
} from "./production-prepare.mjs";

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

function productionEnvironment(overrides = {}) {
	return {
		NODE_ENV: "production",
		DATABASE_URL: "postgresql://postgres.example.com/lets_flex",
		ADMIN_EMAIL: "admin@example.com",
		ADMIN_PASSWORD: "a sufficiently long test password",
		R2_BUCKET_NAME: "lets-flex-media-prod",
		R2_ENDPOINT: "https://account.r2.cloudflarestorage.com",
		R2_ACCESS_KEY_ID: "media-access-key",
		R2_SECRET_ACCESS_KEY: "media-secret-key",
		R2_CANONICAL_REGISTRY_BUCKET_NAME: "lets-flex-canonical-registry-prod",
		R2_CANONICAL_REGISTRY_PREFIX: "v1",
		R2_CANONICAL_REGISTRY_ACCESS_KEY_ID: "registry-access-key",
		R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY: "registry-secret-key",
		PRODUCTION_DATABASE_RESET_MODE,
		ALLOW_PRODUCTION_DB_RESET: PRODUCTION_DATABASE_RESET_AUTHORIZATION,
		...overrides,
	};
}

function fakeRegistry(overrides = {}) {
	return {
		async listCanonicalOverrides() {
			return [{ entry }];
		},
		...overrides,
	};
}

test("missing production reset opt-in is fast and non-destructive", async () => {
	const calls = [];
	const result = await prepareProductionDeployment({
		environment: { NODE_ENV: "production" },
		dependencies: {
			resetDatabase: async () => calls.push("reset"),
		},
		log: () => {},
	});

	assert.deepEqual(result, { status: "disabled" });
	assert.deepEqual(calls, []);
});

test("an unexpected reset value fails safely before any destructive operation", async () => {
	const calls = [];
	await assert.rejects(
		prepareProductionDeployment({
			environment: productionEnvironment({
				PRODUCTION_DATABASE_RESET_MODE: "true",
			}),
			dependencies: {
				resetDatabase: async () => calls.push("reset"),
			},
			log: () => {},
		}),
		/PRODUCTION_DATABASE_RESET_MODE must be unset or exactly reset-and-restore/,
	);
	assert.deepEqual(calls, []);
});

test("production preparation requires the exact reset confirmation", async () => {
	for (const authorization of [undefined, "", "true", "I_CONFIRM_PRODUCTION_RESET"]) {
		const calls = [];
		await assert.rejects(
			prepareProductionDeployment({
				environment: productionEnvironment({
					ALLOW_PRODUCTION_DB_RESET: authorization,
				}),
				dependencies: {
					resetDatabase: async () => calls.push("reset"),
				},
				log: () => {},
			}),
			/explicit reset authorization/,
		);
		assert.deepEqual(calls, []);
	}
});

test("successful preparation preserves the preflight snapshot and ordering", async () => {
	const calls = [];
	let resetOptions;
	let verifyInput;
	const result = await prepareProductionDeployment({
		environment: productionEnvironment(),
		dependencies: {
			registry: fakeRegistry(),
			mediaStorage: { exists: async () => true },
			resetDatabase: async (options) => {
				calls.push("reset");
				resetOptions = options;
			},
			verifyRestoration: async (input) => {
				calls.push("verify");
				verifyInput = input;
				return { count: 1 };
			},
		},
		log: () => {},
	});

	assert.deepEqual(result, { status: "completed", count: 1 });
	assert.deepEqual(calls, ["reset", "verify"]);
	assert.equal(resetOptions.registryPreflight.entries[0], verifyInput.entries[0]);
	assert.equal(resetOptions.allowProductionReset, true);
});

test("registry preflight failure never invokes database reset", async () => {
	const calls = [];
	await assert.rejects(
		prepareProductionDeployment({
			environment: productionEnvironment(),
			dependencies: {
				registry: fakeRegistry({
					async listCanonicalOverrides() {
						throw new Error("registry unavailable");
					},
				}),
				mediaStorage: { exists: async () => true },
				resetDatabase: async () => calls.push("reset"),
			},
			log: () => {},
		}),
	);
	assert.deepEqual(calls, []);
});

test("reset, restoration, and verification failures stop the lifecycle", async () => {
	const restoreCalls = [];
	await assert.rejects(
		prepareProductionDeployment({
			environment: productionEnvironment(),
			dependencies: {
				registry: fakeRegistry(),
				mediaStorage: { exists: async () => true },
				resetDatabase: async () => {
					throw new Error("reset failed");
				},
				verifyRestoration: async () => restoreCalls.push("verify"),
			},
			log: () => {},
		}),
	);
	assert.deepEqual(restoreCalls, []);

	await assert.rejects(
		prepareProductionDeployment({
			environment: productionEnvironment(),
			dependencies: {
				registry: fakeRegistry(),
				mediaStorage: { exists: async () => true },
				resetDatabase: async () => {},
				verifyRestoration: async () => {
					throw new Error("verification failed");
				},
			},
			log: () => {},
		}),
		/verification failed/,
	);
});

test("production guard rejects a non-production runtime", async () => {
	await assert.rejects(
		prepareProductionDeployment({
			environment: productionEnvironment({ NODE_ENV: "staging" }),
			dependencies: {
				resetDatabase: async () => {
					throw new Error("must not run");
				},
			},
			log: () => {},
		}),
		/NODE_ENV=production/,
	);
});
