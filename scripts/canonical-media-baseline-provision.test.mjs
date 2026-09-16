import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";

import { canonicalMediaManifest } from "../src/features/media/mediaManifest.js";
import {
	CanonicalMediaBaselineProvisioningError,
	provisionCanonicalMediaBaseline,
} from "../src/features/media/canonicalMediaBaselineProvisioning.js";
import {
	CanonicalMediaProvisionConfigurationError,
	formatCanonicalMediaProvisionFailure,
	readCanonicalMediaProvisionConfiguration,
	runCanonicalMediaBaselineProvision,
} from "./canonical-media-baseline-provision.mjs";

const entry = {
	...canonicalMediaManifest.find(
		(candidate) =>
			candidate.entityType === "exercise" && candidate.entityKey === "push-up",
	),
};
const abductorsEntry = {
	...canonicalMediaManifest.find(
		(candidate) =>
			candidate.entityType === "muscle" && candidate.entityKey === "abductors",
	),
};

function fakeStore(objects = {}) {
	const values = new Map(
		Object.entries(objects).map(([key, value]) => [key, Buffer.from(value)]),
	);
	const writes = [];
	return {
		writes,
		async read(key) {
			return values.has(key) ? Buffer.from(values.get(key)) : null;
		},
		async putIfAbsent(key, bytes) {
			if (values.has(key)) throw new Error("conditional conflict");
			values.set(key, Buffer.from(bytes));
			writes.push(key);
		},
	};
}

const environment = {
	CANONICAL_MEDIA_TARGET: "development",
	R2_BUCKET_NAME: "lets-flex-media-dev",
	R2_ENDPOINT: "https://account.r2.cloudflarestorage.com",
	R2_ACCESS_KEY_ID: "access-key",
	R2_SECRET_ACCESS_KEY: "secret-key",
};

test("baseline provisioning verifies identical bytes without writing", async () => {
	const source = await provisionCanonicalMediaBaseline({
		manifest: [entry],
		objectStore: fakeStore({
			[entry.storageKey]: await import("node:fs/promises").then(({ readFile }) =>
				readFile(`public${entry.path}`),
			),
		}),
		mode: "verify",
	});
	assert.deepEqual(source, {
		mode: "verify",
		total: 1,
		adopted: 1,
		identical: 1,
		byteDriftWarnings: 0,
		missing: 0,
		created: 0,
		failures: 0,
		warnings: [],
	});
});

test("dry-run reports missing baseline bytes without writing", async () => {
	const store = fakeStore();
	const result = await runCanonicalMediaBaselineProvision({
		environment,
		target: "development",
		mode: "dry-run",
		dependencies: { objectStore: store },
		log: () => {},
	});
	assert.equal(result.missing, 70);
	assert.equal(result.created, 0);
	assert.equal(result.failures, 0);
	assert.deepEqual(store.writes, []);
});

test("verify rejects missing baseline bytes with the canonical object identity", async () => {
	await assert.rejects(
		provisionCanonicalMediaBaseline({
			manifest: [entry],
			objectStore: fakeStore(),
			mode: "verify",
		}),
		(error) => {
			assert.ok(error instanceof CanonicalMediaBaselineProvisioningError);
			assert.deepEqual(error.issues, [
				{
					entityType: entry.entityType,
					entityKey: entry.entityKey,
					objectKey: entry.storageKey,
					reason: "canonical R2 object is missing",
				},
			]);
			return true;
		},
	);
});

test("apply preserves manifest storage keys and creates only missing objects", async () => {
	const store = fakeStore();
	const result = await runCanonicalMediaBaselineProvision({
		environment: {
			...environment,
			CANONICAL_MEDIA_PROVISION_CONFIRMATION:
				"I_CONFIRM_DEVELOPMENT_CANONICAL_MEDIA_PROVISION",
		},
		target: "development",
		mode: "apply",
		dependencies: { objectStore: store },
		log: () => {},
	});
	assert.equal(result.created, 70);
	assert.equal(result.missing, 0);
	assert.equal(store.writes.length, 70);
	assert.deepEqual(
		store.writes,
		canonicalMediaManifest.map((candidate) => candidate.storageKey),
	);
	const repeat = await runCanonicalMediaBaselineProvision({
		environment: {
			...environment,
			CANONICAL_MEDIA_PROVISION_CONFIRMATION:
				"I_CONFIRM_DEVELOPMENT_CANONICAL_MEDIA_PROVISION",
		},
		target: "development",
		mode: "apply",
		dependencies: { objectStore: store },
		log: () => {},
	});
	assert.equal(repeat.created, 0);
	assert.equal(repeat.identical, 70);
	assert.equal(store.writes.length, 70);
});

test("different existing bytes are adopted as drift and are never overwritten", async () => {
	const store = fakeStore({ [abductorsEntry.storageKey]: "different bytes" });
	const result = await provisionCanonicalMediaBaseline({
		manifest: [abductorsEntry],
		objectStore: store,
		mode: "apply",
	});
	assert.equal(result.adopted, 1);
	assert.equal(result.identical, 0);
	assert.equal(result.byteDriftWarnings, 1);
	assert.equal(result.missing, 0);
	assert.equal(result.failures, 0);
	assert.equal(result.warnings.length, 1);
	assert.match(result.warnings[0].reason, /adopted with different bytes/);
	assert.equal(result.warnings[0].details.expectedBytes, 40797);
	assert.equal(result.warnings[0].details.actualBytes, "different bytes".length);
	assert.match(result.warnings[0].details.expectedSha256, /^[a-f0-9]{64}$/u);
	assert.match(result.warnings[0].details.actualSha256, /^[a-f0-9]{64}$/u);
	assert.deepEqual(store.writes, []);
});

test("run reports adopted byte drift as a warning while passing verification", async () => {
	const logs = [];
	const result = await runCanonicalMediaBaselineProvision({
		environment,
		target: "development",
		mode: "verify",
		dependencies: {
			objectStore: fakeStore({ [abductorsEntry.storageKey]: "different bytes" }),
		},
		manifest: [abductorsEntry],
		log: (message) => logs.push(message),
	});
	assert.equal(result.status, "passed");
	assert.equal(result.byteDriftWarnings, 1);
	assert.equal(result.failures, 0);
	assert.match(logs[0], /verify passed for development/);
	assert.match(logs[0], /adopted-existing=1/);
	assert.match(logs[0], /byte-identical=0/);
	assert.match(logs[0], /drift-warnings=1/);
	assert.match(logs[1], /category=byte-drift-warning/);
	assert.match(logs[1], /entity=muscle:abductors/);
	assert.match(logs[1], /actualBytes=15/);
});

test("existing-object provider failures remain verification failures", async () => {
	const providerError = Object.assign(new Error("access denied"), {
		name: "AccessDenied",
		code: "AccessDenied",
		$metadata: { httpStatusCode: 403 },
	});
	await assert.rejects(
		provisionCanonicalMediaBaseline({
			manifest: [abductorsEntry],
			objectStore: {
				async read() {
					throw providerError;
				},
				async putIfAbsent() {},
			},
			mode: "verify",
		}),
		(error) => {
			assert.ok(error instanceof CanonicalMediaBaselineProvisioningError);
			assert.equal(error.issues.length, 1);
			assert.equal(error.issues[0].cause, providerError);
			assert.equal(error.issues[0].reason, "existing R2 object could not be read");
			return true;
		},
	);
});

test("production apply requires explicit confirmation and refuses development buckets", () => {
	assert.throws(
		() =>
			readCanonicalMediaProvisionConfiguration(
				{ ...environment, CANONICAL_MEDIA_TARGET: "production" },
				{ target: "production", mode: "apply" },
			),
		/Production canonical media provisioning refuses a development-scoped R2 bucket/,
	);
	assert.throws(
		() =>
			readCanonicalMediaProvisionConfiguration(
				{
					...environment,
					R2_BUCKET_NAME: "lets-flex-media-prod",
				},
				{ target: "production", mode: "apply" },
			),
		/production confirmation/,
	);
});

test("expected configuration and provider failures produce actionable safe diagnostics", () => {
	const configurationError = new CanonicalMediaProvisionConfigurationError(
		"R2 configuration is incomplete or invalid.",
		new Error("R2_ACCESS_KEY_ID is required."),
	);
	const configurationLines = formatCanonicalMediaProvisionFailure(configurationError, {
		target: "production",
		mode: "verify",
		bucketName: "lets-flex-media-prod",
	});
	assert.match(
		configurationLines[0],
		/target=production mode=verify bucket=lets-flex-media-prod/,
	);
	assert.match(configurationLines[0], /category=configuration-error/);
	assert.match(configurationLines[1], /R2_ACCESS_KEY_ID is required/);

	const providerError = Object.assign(
		new Error("request failed with secret=do-not-log"),
		{
			name: "AccessDenied",
			code: "AccessDenied",
			$metadata: { httpStatusCode: 403 },
		},
	);
	const providerLines = formatCanonicalMediaProvisionFailure(
		new CanonicalMediaBaselineProvisioningError([
			{
				entityType: "exercise",
				entityKey: "push-up",
				objectKey: "assets/push-up.webp",
				reason: "existing R2 object could not be read",
				cause: providerError,
				details: {
					expectedSha256: "expected-digest",
					actualSha256: "actual-digest",
					expectedBytes: 40797,
					actualBytes: 41000,
				},
			},
		]),
		{ target: "production", mode: "verify", bucketName: "lets-flex-media-prod" },
	);
	assert.match(providerLines[1], /category=bucket-authentication-or-access-failure/);
	assert.match(providerLines[1], /AccessDenied code=AccessDenied status=403/);
	assert.match(
		providerLines[1],
		/expectedSha256=expected-digest actualSha256=actual-digest/,
	);
	assert.doesNotMatch(providerLines[1], /do-not-log/);
});
