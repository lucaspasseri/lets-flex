import assert from "node:assert/strict";
import test from "node:test";

import {
	CanonicalMediaRegistryError,
	createCanonicalMediaRegistry,
} from "./canonicalMediaRegistry.js";

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

function store(overrides = {}) {
	return {
		async getCanonicalOverride() {
			return null;
		},
		async putCanonicalOverride(value, options) {
			return { entry: value, etag: options?.expectedEtag ?? "new" };
		},
		async deleteCanonicalOverride() {},
		async listCanonicalOverrides() {
			return [];
		},
		...overrides,
	};
}

test("registry domain validates entries before writing and reads through the store", async () => {
	const calls = [];
	const registry = createCanonicalMediaRegistry(
		store({
			async getCanonicalOverride(entityType, entityKey) {
				calls.push(["get", entityType, entityKey]);
				return { entry, etag: "etag-1" };
			},
			async putCanonicalOverride(value, options) {
				calls.push(["put", value.entityKey, options.expectedEtag]);
				return { entry: value, etag: "etag-2" };
			},
		}),
	);

	assert.deepEqual(await registry.getCanonicalOverride("exercise", "push-up"), {
		entry,
		etag: "etag-1",
	});
	assert.deepEqual(
		await registry.putCanonicalOverride(entry, { expectedEtag: "etag-1" }),
		{
			entry,
			etag: "etag-2",
		},
	);
	assert.deepEqual(calls, [
		["get", "exercise", "push-up"],
		["put", "push-up", "etag-1"],
	]);
});

test("registry domain turns conditional-write failures into controlled conflicts", async () => {
	const registry = createCanonicalMediaRegistry(
		store({
			async putCanonicalOverride() {
				const error = new Error("precondition");
				error.name = "PreconditionFailed";
				throw error;
			},
		}),
	);

	await assert.rejects(
		() => registry.putCanonicalOverride(entry, { expectedEtag: "old" }),
		(error) =>
			error instanceof CanonicalMediaRegistryError && error.code === "write_conflict",
	);
});

test("registry domain rejects an injected store without the required boundary", () => {
	assert.throws(
		() => createCanonicalMediaRegistry(/** @type {any} */ ({})),
		/operation is missing/,
	);
});
