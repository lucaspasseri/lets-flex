import assert from "node:assert/strict";
import test from "node:test";

import { runCanonicalMediaRecoveryRehearsal } from "./canonical-media-recovery-rehearsal.mjs";

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
