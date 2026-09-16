import assert from "node:assert/strict";
import test from "node:test";

import {
	canonicalRegistryObjectKey,
	validateCanonicalRegistryEntry,
} from "./canonicalMediaRegistrySchema.js";

const validEntry =
	/** @type {import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry} */ ({
		schemaVersion: 1,
		entityType: "exercise",
		entityKey: "push-up",
		role: "canonical",
		asset: {
			objectKey: "assets/abc.webp",
			mimeType: "image/webp",
			width: 1024,
			height: 768,
			checksum: "a".repeat(64),
		},
		canonicalPath: "/media/catalog/promoted/exercise/push-up-a.webp",
		alt: { en: "Push-up", "pt-BR": "Flexão" },
		updatedAt: "2026-09-16T00:00:00.000Z",
	});

test("canonical registry validates versioned stable-key entries", () => {
	assert.deepEqual(validateCanonicalRegistryEntry(validEntry), validEntry);
	assert.equal(
		canonicalRegistryObjectKey("exercise", "push-up", "v1"),
		"v1/exercise/push-up.json",
	);
});

test("canonical registry rejects malformed or unsupported entries", () => {
	for (const [name, change] of /** @type {Array<[string, Record<string, any>]>} */ ([
		["unsupported version", { schemaVersion: 2 }],
		["unsupported type", { entityType: "category" }],
		["missing key", { entityKey: "" }],
		["unsafe object key", { asset: { ...validEntry.asset, objectKey: "assets/../x" } }],
		["unsupported MIME", { asset: { ...validEntry.asset, mimeType: "video/mp4" } }],
		["missing locale", { alt: { en: "Only English" } }],
	])) {
		assert.throws(
			() => validateCanonicalRegistryEntry({ ...validEntry, ...change }),
			/Invalid canonical registry entry/,
			name,
		);
	}
});

test("canonical registry rejects unsafe prefixes and paths", () => {
	assert.throws(
		() => canonicalRegistryObjectKey("exercise", "push-up", "v1/../prod"),
		/unsafe/,
	);
	assert.throws(
		() =>
			validateCanonicalRegistryEntry({
				...validEntry,
				asset: { ...validEntry.asset, objectKey: "https://example.test/a" },
			}),
		/unsafe/,
	);
});
