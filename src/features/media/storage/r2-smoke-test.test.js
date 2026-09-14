import assert from "node:assert/strict";
import test from "node:test";
import {
	readR2SmokeTestConfiguration,
	runR2SmokeTest,
} from "../../../../scripts/r2-smoke-test.mjs";

const validEnvironment = {
	R2_BUCKET_NAME: "lets-flex-media-dev",
	R2_DEVELOPMENT_BUCKET_NAME: "lets-flex-media-dev",
	R2_ENDPOINT: "https://account.r2.cloudflarestorage.com",
	R2_REGION: "auto",
	R2_ACCESS_KEY_ID: "access-key",
	R2_SECRET_ACCESS_KEY: "secret-key",
	R2_SMOKE_TEST_CONFIRMATION: "I_CONFIRM_DEVELOPMENT_BUCKET",
};

test("R2 smoke-test configuration requires explicit development-bucket selection", () => {
	assert.deepEqual(readR2SmokeTestConfiguration(validEnvironment), {
		bucketName: "lets-flex-media-dev",
		endpoint: "https://account.r2.cloudflarestorage.com",
		region: "auto",
		accessKeyId: "access-key",
		secretAccessKey: "secret-key",
	});

	assert.throws(
		() =>
			readR2SmokeTestConfiguration({
				...validEnvironment,
				R2_BUCKET_NAME: "lets-flex-media-production",
			}),
		/selected development bucket/,
	);
	assert.throws(
		() =>
			readR2SmokeTestConfiguration({
				...validEnvironment,
				R2_SMOKE_TEST_CONFIRMATION: "",
			}),
		/explicit development-bucket confirmation/,
	);
});

test("R2 smoke test always cleans up after a successful put", async () => {
	const commands = [];
	const client = {
		async send(command) {
			commands.push(command);
			if (commands.length === 2) {
				return { Body: { transformToString: async () => "Let's Flex R2 smoke test" } };
			}
			if (commands.length === 4) {
				const missing = new Error("missing");
				missing.name = "NotFound";
				throw missing;
			}
			return {};
		},
	};

	const result = await runR2SmokeTest({
		client,
		configuration: readR2SmokeTestConfiguration(validEnvironment),
		key: "_smoke-tests/fixed.txt",
	});

	assert.deepEqual(result, { key: "_smoke-tests/fixed.txt" });
	assert.equal(commands.length, 4);
	assert.deepEqual(commands[0].input, {
		Bucket: "lets-flex-media-dev",
		Key: "_smoke-tests/fixed.txt",
		Body: "Let's Flex R2 smoke test",
		ContentType: "text/plain",
	});
	assert.deepEqual(commands[2].input, {
		Bucket: "lets-flex-media-dev",
		Key: "_smoke-tests/fixed.txt",
	});
	assert.deepEqual(commands[3].input, {
		Bucket: "lets-flex-media-dev",
		Key: "_smoke-tests/fixed.txt",
	});
});
