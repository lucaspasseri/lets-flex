import assert from "node:assert/strict";
import test from "node:test";
import canonicalMediaData from "../../../../data/canonical-media.json" with { type: "json" };
import {
	createPublicMediaObjectKey,
	legacyMediaPathToObjectKey,
	normalizeMediaObjectKey,
} from "./mediaObjectKey.js";

test("new public media keys are opaque, immutable, and independent of filenames", () => {
	const first = createPublicMediaObjectKey({
		extension: "WEBP",
		generatedId: "019abc123",
	});
	const second = createPublicMediaObjectKey({
		extension: "png",
		generatedId: "019abc124",
	});

	assert.equal(first, "assets/019abc123.webp");
	assert.equal(second, "assets/019abc124.png");
	assert.doesNotMatch(first, /exercise|bench|filename/iu);
	assert.notEqual(first, second);
});

test("object-key validation accepts relative legacy keys and rejects URL/path traversal forms", () => {
	assert.equal(
		normalizeMediaObjectKey("assets/019abc123.webp"),
		"assets/019abc123.webp",
	);
	assert.equal(
		legacyMediaPathToObjectKey("/media/catalog/exercises/bench-press.png"),
		"media/catalog/exercises/bench-press.png",
	);

	assert.throws(() => normalizeMediaObjectKey("/assets/image.png"), /invalid/);
	assert.throws(() => normalizeMediaObjectKey("assets/../private.png"), /invalid/);
	assert.throws(
		() => normalizeMediaObjectKey("https://cdn.example/assets.png"),
		/invalid/,
	);
	assert.throws(
		() => legacyMediaPathToObjectKey("/private/candidate.png"),
		/under \/media/,
	);
});

test("all current canonical paths have a lossless legacy object-key conversion", () => {
	const keys = canonicalMediaData.map((entry) =>
		legacyMediaPathToObjectKey(entry.path),
	);
	assert.equal(new Set(keys).size, canonicalMediaData.length);
	assert.ok(keys.every((key) => key.startsWith("media/")));
});
