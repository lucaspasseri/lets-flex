import assert from "node:assert/strict";
import test from "node:test";

import { canonicalMediaManifest } from "../src/features/media/mediaManifest.js";
import {
	CanonicalMediaDurabilityPreflightError,
	preflightCanonicalMediaDurability,
} from "../src/features/media/registry/canonicalMediaDurabilityPreflight.js";
import { runCanonicalMediaDurabilityPreflight } from "./canonical-media-durability-preflight.mjs";

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

const baselineEntry = {
	...canonicalMediaManifest.find(
		(entry) => entry.entityType === "exercise" && entry.entityKey === "push-up",
	),
};

function registry(overrides = {}) {
	return {
		async listCanonicalOverrides() {
			return [{ entry: registryEntry }];
		},
		...overrides,
	};
}

test("complete durability preflight validates baseline and registry without PostgreSQL", async () => {
	const checked = [];
	const result = await runCanonicalMediaDurabilityPreflight({
		dependencies: {
			registry: registry(),
			mediaStorage: {
				async exists(storageKey) {
					checked.push(storageKey);
					return true;
				},
			},
		},
		log: () => {},
	});

	assert.deepEqual(result, {
		status: "passed",
		baselineCount: 70,
		registryCount: 1,
		assignmentCount: 71,
	});
	assert.equal(checked.length, 71);
	assert.ok(checked.includes(baselineEntry.storageKey));
	assert.ok(checked.includes(registryEntry.asset.objectKey));
});

test("durability preflight rejects a missing baseline R2 object", async () => {
	await assert.rejects(
		preflightCanonicalMediaDurability({
			manifest: [baselineEntry],
			registry: registry({
				async listCanonicalOverrides() {
					return [];
				},
			}),
			mediaStorage: { exists: async () => false },
		}),
		(error) => {
			assert.ok(error instanceof CanonicalMediaDurabilityPreflightError);
			assert.deepEqual(error.issues, [
				{
					scope: "baseline",
					entityType: "exercise",
					entityKey: "push-up",
					objectKey: baselineEntry.storageKey,
					reason: "referenced production R2 media object is missing",
				},
			]);
			return true;
		},
	);
});

test("durability preflight preserves registry validation failures", async () => {
	const unavailable = new Error("unavailable");
	await assert.rejects(
		preflightCanonicalMediaDurability({
			manifest: [baselineEntry],
			registry: registry({
				async listCanonicalOverrides() {
					throw unavailable;
				},
			}),
			mediaStorage: { exists: async () => true },
		}),
		(error) => {
			assert.ok(error instanceof CanonicalMediaDurabilityPreflightError);
			assert.equal(error.issues.length, 1);
			assert.equal(error.issues[0].scope, "registry");
			assert.equal(error.issues[0].reason, "registry could not be read");
			assert.equal(error.issues[0].cause, unavailable);
			return true;
		},
	);
});

test("durability preflight rejects malformed baseline metadata before probing it", async () => {
	const malformed = { ...baselineEntry, altTexts: { en: "", "pt-BR": "ok" } };
	let probes = 0;
	await assert.rejects(
		preflightCanonicalMediaDurability({
			manifest: [malformed],
			registry: registry({
				async listCanonicalOverrides() {
					return [];
				},
			}),
			mediaStorage: {
				async exists() {
					probes += 1;
					return true;
				},
			},
		}),
		/Canonical media durability preflight failed with 1 issue/,
	);
	assert.equal(probes, 0);
});
