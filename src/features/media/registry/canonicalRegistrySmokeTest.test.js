import assert from "node:assert/strict";
import test from "node:test";

import {
	readCanonicalRegistrySmokeTestConfiguration,
	runCanonicalRegistrySmokeTest,
} from "../../../../scripts/canonical-registry-smoke-test.mjs";

const environment = {
	R2_CANONICAL_REGISTRY_BUCKET_NAME: "lets-flex-canonical-registry-dev",
	R2_CANONICAL_REGISTRY_PREFIX: "v1",
	R2_ENDPOINT: "https://account.r2.cloudflarestorage.com",
	R2_REGION: "auto",
	R2_CANONICAL_REGISTRY_ACCESS_KEY_ID: "access-key",
	R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY: "secret-key",
	R2_CANONICAL_REGISTRY_SMOKE_TEST_CONFIRMATION:
		"I_CONFIRM_DEVELOPMENT_CANONICAL_REGISTRY",
};

test("canonical registry smoke configuration only permits explicit development buckets", () => {
	assert.equal(
		readCanonicalRegistrySmokeTestConfiguration(environment).bucketName,
		"lets-flex-canonical-registry-dev",
	);
	assert.throws(
		() =>
			readCanonicalRegistrySmokeTestConfiguration({
				...environment,
				R2_CANONICAL_REGISTRY_BUCKET_NAME: "lets-flex-canonical-registry-production",
			}),
		/non-development bucket/,
	);
	assert.throws(
		() =>
			readCanonicalRegistrySmokeTestConfiguration({
				...environment,
				R2_CANONICAL_REGISTRY_SMOKE_TEST_CONFIRMATION: "",
			}),
		/explicit development confirmation/,
	);
});

test("canonical registry smoke test cleans up after put/read", async () => {
	const commands = [];
	const client = {
		async send(command) {
			commands.push(command);
			if (commands.length === 2)
				return {
					Body: {
						transformToString: async () =>
							'{"smokeTest":"lets-flex-canonical-registry"}',
					},
				};
			if (commands.length === 4) {
				const error = new Error("missing");
				error.name = "NotFound";
				throw error;
			}
			return {};
		},
	};
	const result = await runCanonicalRegistrySmokeTest({
		client,
		configuration: readCanonicalRegistrySmokeTestConfiguration(environment),
		key: "v1/_smoke-test/fixed.json",
	});
	assert.deepEqual(result, { key: "v1/_smoke-test/fixed.json" });
	assert.equal(commands.length, 4);
	assert.equal(commands[0].input.Bucket, environment.R2_CANONICAL_REGISTRY_BUCKET_NAME);
	assert.equal(commands[0].input.Key, "v1/_smoke-test/fixed.json");
});
