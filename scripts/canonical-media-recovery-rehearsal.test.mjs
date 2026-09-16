import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
	CanonicalMediaRecoveryConfigurationError,
	formatCanonicalMediaRecoveryFailure,
	readCanonicalMediaRecoveryConfiguration,
	runCanonicalMediaRecoveryRehearsal,
} from "./canonical-media-recovery-rehearsal.mjs";
import { CanonicalMediaDurabilityPreflightError } from "../src/features/media/registry/canonicalMediaDurabilityPreflight.js";

const registryEntry = {
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
	canonicalPath: "/media/catalog/promoted/exercise-push-up.webp",
	alt: { en: "Push-up", "pt-BR": "Flexão" },
	updatedAt: "2026-09-16T00:00:00.000Z",
};

function dependencies({ failPreflight = false, failReset = false } = {}) {
	const calls = [];
	return {
		calls,
		registry: {
			async listCanonicalOverrides() {
				calls.push("registry.list");
				if (failPreflight) throw new Error("production registry unavailable");
				return [{ entry: registryEntry, etag: "registry-etag" }];
			},
		},
		mediaStorage: {
			async exists() {
				calls.push("media.exists");
				if (failPreflight) throw new Error("production media unavailable");
				return true;
			},
		},
		async resetDatabase(options) {
			calls.push("database.reset");
			assert.deepEqual(options.registryPreflight.entries, [registryEntry]);
			assert.equal(options.registryPreflight.summary.count, 1);
			if (failReset) throw new Error("disposable database reset failed");
		},
		async verifyRestoration(input) {
			calls.push("database.verify");
			assert.deepEqual(input.entries, [registryEntry]);
			return { count: 1 };
		},
	};
}

const environment = {
	NODE_ENV: "test",
	ALLOW_DATABASE_RESET: "true",
	DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/lets_flex_rehearsal",
	ADMIN_EMAIL: "rehearsal@example.com",
	ADMIN_PASSWORD: "rehearsal-only-password",
};

const productionEnvironment = {
	R2_BUCKET_NAME: "lets-flex-media-production",
	R2_ENDPOINT: "https://account.r2.cloudflarestorage.com",
	R2_REGION: "auto",
	R2_ACCESS_KEY_ID: "media-access-key",
	R2_SECRET_ACCESS_KEY: "media-secret-key",
	R2_CANONICAL_REGISTRY_BUCKET_NAME: "lets-flex-canonical-registry-production",
	R2_CANONICAL_REGISTRY_PREFIX: "v1",
	R2_CANONICAL_REGISTRY_ACCESS_KEY_ID: "registry-access-key",
	R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY: "registry-secret-key",
};

test("recovery rehearsal preflights R2, restores its snapshot, and strictly verifies the disposable database", async () => {
	const fake = dependencies();
	const logs = [];
	const result = await runCanonicalMediaRecoveryRehearsal({
		environment,
		dependencies: fake,
		log: (message) => logs.push(message),
	});

	assert.deepEqual(result, {
		status: "passed",
		baselineCount: 70,
		registryCount: 1,
		assignmentCount: 71,
		restoredRegistryCount: 1,
	});
	assert.equal(fake.calls.filter((call) => call === "media.exists").length, 71);
	assert.equal(fake.calls[70], "registry.list");
	assert.equal(fake.calls[71], "media.exists");
	assert.equal(fake.calls[72], "database.reset");
	assert.equal(fake.calls[73], "database.verify");
	assert.match(logs[0], /read-only production R2 durability preflight started/);
	assert.match(logs[1], /read-only preflight passed/);
	assert.match(logs[2], /disposable PostgreSQL schema/);
	assert.match(logs[3], /strict post-restore verification passed/);
});

test("recovery rehearsal never resets the disposable database when R2 preflight fails", async () => {
	const fake = dependencies({ failPreflight: true });
	await assert.rejects(
		() =>
			runCanonicalMediaRecoveryRehearsal({
				environment,
				dependencies: fake,
				log: () => {},
			}),
		/Canonical media durability preflight failed/,
	);
	assert.equal(fake.calls.includes("database.reset"), false);
});

test("recovery rehearsal does not report success when disposable database restoration fails", async () => {
	const fake = dependencies({ failReset: true });
	await assert.rejects(
		() =>
			runCanonicalMediaRecoveryRehearsal({
				environment,
				dependencies: fake,
				log: () => {},
			}),
		/disposable database reset failed/,
	);
	assert.equal(fake.calls.includes("database.verify"), false);
});

test("recovery configuration requires both R2 resources and separate buckets", () => {
	assert.throws(
		() => readCanonicalMediaRecoveryConfiguration({}),
		(error) => {
			assert.ok(error instanceof CanonicalMediaRecoveryConfigurationError);
			assert.match(error.message, /R2_BUCKET_NAME/);
			assert.match(error.message, /R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY/);
			assert.doesNotMatch(error.message, /media-secret-key|registry-secret-key/);
			return true;
		},
	);
	assert.deepEqual(readCanonicalMediaRecoveryConfiguration(productionEnvironment), {
		media: {
			bucketName: "lets-flex-media-production",
			endpoint: productionEnvironment.R2_ENDPOINT,
			region: "auto",
			accessKeyId: productionEnvironment.R2_ACCESS_KEY_ID,
			secretAccessKey: productionEnvironment.R2_SECRET_ACCESS_KEY,
		},
		registry: {
			bucketName: "lets-flex-canonical-registry-production",
			prefix: "v1",
			endpoint: productionEnvironment.R2_ENDPOINT,
			region: "auto",
			accessKeyId: productionEnvironment.R2_CANONICAL_REGISTRY_ACCESS_KEY_ID,
			secretAccessKey: productionEnvironment.R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY,
		},
	});
	assert.throws(
		() =>
			readCanonicalMediaRecoveryConfiguration({
				...productionEnvironment,
				R2_CANONICAL_REGISTRY_BUCKET_NAME: productionEnvironment.R2_BUCKET_NAME,
			}),
		/production media and canonical registry buckets must be separate/i,
	);
});

test("workflow maps every required production Environment value explicitly", async () => {
	const workflow = await readFile(
		new globalThis.URL(
			"../.github/workflows/canonical-media-recovery-rehearsal.yml",
			import.meta.url,
		),
		"utf8",
	);
	for (const name of [
		"R2_BUCKET_NAME",
		"R2_ENDPOINT",
		"R2_REGION",
		"R2_CANONICAL_REGISTRY_BUCKET_NAME",
		"R2_CANONICAL_REGISTRY_PREFIX",
	])
		assert.ok(workflow.includes(`${name}: ` + "${{ vars." + name + " }}"), name);
	for (const name of [
		"R2_ACCESS_KEY_ID",
		"R2_SECRET_ACCESS_KEY",
		"R2_CANONICAL_REGISTRY_ACCESS_KEY_ID",
		"R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY",
	])
		assert.ok(workflow.includes(`${name}: ` + "${{ secrets." + name + " }}"), name);
});

test("recovery failure diagnostics classify all baseline misses without leaking secrets", () => {
	const error = new CanonicalMediaDurabilityPreflightError(
		Array.from({ length: 70 }, (_, index) => ({
			scope: "baseline",
			entityType: "exercise",
			entityKey: `exercise-${index}`,
			objectKey: `assets/exercise-${index}.webp`,
			reason: "referenced production R2 media object is missing",
		})),
	);
	const lines = formatCanonicalMediaRecoveryFailure(error, productionEnvironment);
	assert.match(
		lines[0],
		/category=canonical-media-durability-preflight-failed issues=70 canonical-object-missing=70/,
	);
	assert.equal(lines.length, 71);
	assert.match(lines[1], /scope=baseline/);
	assert.doesNotMatch(lines.join("\n"), /media-secret-key|registry-secret-key/);
});

test("recovery failure diagnostics classify provider errors safely", () => {
	const providerError = Object.assign(new Error("access denied secret=do-not-log"), {
		name: "AccessDenied",
		code: "AccessDenied",
		$metadata: { httpStatusCode: 403 },
	});
	const lines = formatCanonicalMediaRecoveryFailure(
		new CanonicalMediaDurabilityPreflightError([
			{
				scope: "registry",
				reason: "registry could not be read",
				cause: providerError,
			},
		]),
		productionEnvironment,
	);
	assert.match(lines[0], /bucket-authentication-or-access-failure=1/);
	assert.match(lines[1], /provider=AccessDenied code=AccessDenied status=403/);
	assert.doesNotMatch(lines[1], /do-not-log/);
});

test("recovery configuration diagnostics include safe validation details", () => {
	const lines = formatCanonicalMediaRecoveryFailure(
		new CanonicalMediaRecoveryConfigurationError(
			"R2 configuration is invalid.",
			new Error("R2_ENDPOINT must be an HTTPS URL; secret=do-not-log"),
		),
		productionEnvironment,
	);
	assert.match(lines[0], /category=configuration-error/);
	assert.match(lines[1], /R2_ENDPOINT must be an HTTPS URL/);
	assert.doesNotMatch(lines[1], /do-not-log/);
});
