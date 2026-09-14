import assert from "node:assert/strict";
import test from "node:test";

import { resolveEntityMedia } from "./resolveEntityMedia.js";
import { createMediaUrlResolver } from "./storage/mediaUrl.js";

function fakeDatabase(rows) {
	const calls = [];
	return {
		calls,
		async query(text, values) {
			calls.push({ text, values });
			return { rows };
		},
	};
}

const asset = {
	media_asset_id: 4,
	storage_key: "/media/barbell-bench-press.svg",
	mime_type: "image/svg+xml",
	width: 960,
	height: 640,
	source: "curated",
	alt_text: "Barbell bench press illustration",
};

test("direct variant media wins over inherited exercise media", async () => {
	const db = fakeDatabase([
		{
			...asset,
			entity_type: "exercise_variant",
			entity_id: 11,
		},
		{
			...asset,
			entity_type: "exercise",
			entity_id: 9,
			storage_key: "/media/bench-press.svg",
		},
	]);
	const media = await resolveEntityMedia(
		{
			entityType: "exercise_variant",
			entityId: 11,
			parentExerciseId: 9,
			label: "Barbell Bench Press",
		},
		/** @type {any} */ (db),
	);

	assert.equal(media.src, "/media/barbell-bench-press.svg");
	assert.equal(media.matchType, "exercise_variant");
	assert.equal(media.matchedId, 11);
	assert.equal(media.fallbackType, "none");
	assert.equal(media.isFallback, false);
	assert.equal(media.mediaType, "image");
});

test("variant inherits the base exercise assignment before contextual fallbacks", async () => {
	const db = fakeDatabase([
		{
			...asset,
			entity_type: "exercise",
			entity_id: 9,
			storage_key: "/media/bench-press.svg",
			alt_text: null,
		},
	]);
	const media = await resolveEntityMedia(
		{
			entityType: "exercise_variant",
			entityId: 11,
			parentExerciseId: 9,
			movementPatternId: 20,
			variantName: "Dumbbell Bench Press",
			baseName: "Bench Press",
			movementPattern: "Push",
			label: "Dumbbell Bench Press",
		},
		/** @type {any} */ (db),
	);

	assert.equal(media.src, "/media/bench-press.svg");
	assert.equal(media.matchType, "exercise");
	assert.equal(media.matchedId, 9);
	assert.equal(media.fallbackType, "base-exercise");
	assert.equal(media.isFallback, true);
	assert.equal(media.alt, "Dumbbell Bench Press image");
});

test("movement assignment is the next persistent fallback", async () => {
	const db = fakeDatabase([
		{
			...asset,
			entity_type: "movement_pattern",
			entity_id: 20,
			storage_key: "/media/movement-push.svg",
		},
	]);
	const media = await resolveEntityMedia(
		{
			entityType: "exercise_variant",
			entityId: 11,
			parentExerciseId: 9,
			movementPatternId: 20,
			label: "Unlisted Press",
		},
		/** @type {any} */ (db),
	);

	assert.equal(media.matchType, "movement_pattern");
	assert.equal(media.fallbackType, "movement-pattern");
	assert.equal(media.isFallback, true);
});

test("missing persistent media preserves the stable initial fallback", async () => {
	const db = fakeDatabase([]);
	const media = await resolveEntityMedia(
		{
			entityType: "exercise_variant",
			entityId: 11,
			parentExerciseId: 9,
			variantName: "Unlisted Exercise Variant",
			baseName: "Unlisted Exercise",
			label: "Unlisted Exercise Variant",
		},
		/** @type {any} */ (db),
	);

	assert.equal(media.src, null);
	assert.equal(media.presentation, "initial");
	assert.equal(media.mediaType, "initial");
	assert.equal(media.fallbackType, "initial");
	assert.equal(media.initial, "U");
	assert.equal(media.isFallback, true);
});

test("malformed optional alt text does not crash the resolver", async () => {
	const db = fakeDatabase([
		{
			...asset,
			entity_type: "exercise",
			entity_id: 9,
			alt_text: "   ",
		},
	]);
	const media = await resolveEntityMedia(
		{
			entityType: "exercise",
			entityId: 9,
			label: "Bench Press",
		},
		/** @type {any} */ (db),
	);

	assert.equal(media.alt, "Bench Press image");
});

test("localized alt text prefers the requested locale and falls back to English", async () => {
	const localizedAsset = {
		...asset,
		entity_type: "exercise",
		entity_id: 9,
		alt_text: null,
		alt_text_en: "Bench press illustration",
		alt_text_pt_br: "Ilustração de supino",
	};
	const db = fakeDatabase([localizedAsset]);

	const portuguese = await resolveEntityMedia(
		{ entityType: "exercise", entityId: 9, label: "Supino", locale: "pt-BR" },
		/** @type {any} */ (db),
	);
	const missingPortuguese = await resolveEntityMedia(
		{ entityType: "exercise", entityId: 9, label: "Supino", locale: "pt-BR" },
		/** @type {any} */ (fakeDatabase([{ ...localizedAsset, alt_text_pt_br: null }])),
	);

	assert.equal(portuguese.alt, "Ilustração de supino");
	assert.equal(missingPortuguese.alt, "Bench press illustration");
});

test("remote reads derive configured URLs for migrated canonical assignments and fallbacks", async () => {
	const mediaUrlResolver = createMediaUrlResolver({
		remoteReads: true,
		publicUrlBase: "https://cdn.example.test/media",
	});
	const assigned = await resolveEntityMedia(
		{ entityType: "exercise", entityId: 9, label: "Bench Press" },
		/** @type {any} */ (
			fakeDatabase([
				{
					...asset,
					entity_type: "exercise",
					entity_id: 9,
					storage_key: "/media/catalog/exercises/bench-press.png",
				},
			])
		),
		{ mediaUrlResolver },
	);
	const fallback = await resolveEntityMedia(
		{
			entityType: "exercise",
			entityId: 99,
			baseName: "Bench Press",
			label: "Bench Press",
		},
		/** @type {any} */ (fakeDatabase([])),
		{ mediaUrlResolver },
	);

	assert.equal(
		assigned.src,
		"https://cdn.example.test/media/assets/ce5b3f5e-3d3b-48b4-ab6d-efd0da01303a.png",
	);
	assert.equal(
		fallback.src,
		"https://cdn.example.test/media/assets/ce5b3f5e-3d3b-48b4-ab6d-efd0da01303a.png",
	);
});
