import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { canonicalMediaManifest, mediaManifest } from "./mediaManifest.js";
import { resolveMedia } from "./resolveMedia.js";
import { validateMediaManifest } from "./validateMediaManifest.js";

test("the curated manifest has valid local asset metadata and files", async () => {
	const result = validateMediaManifest(mediaManifest);

	assert.equal(result.assetCount, 76);
	assert.equal(result.sources.length, 75);
	assert.ok(result.sources.every((source) => source.startsWith("/media/")));

	assert.equal(canonicalMediaManifest.length, 68);
	const assets = await Promise.all(
		canonicalMediaManifest.map(async (entry) => {
			const fileUrl = new URL(`../../../public${entry.path}`, import.meta.url);
			return readFile(fileUrl);
		}),
	);

	assert.ok(
		assets.every(
			(asset) =>
				asset
					.subarray(0, 8)
					.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
				asset.toString("utf8").startsWith("<svg "),
		),
	);
});

test("exact exercise variant media wins over base and fallback media", () => {
	const media = resolveMedia({
		entityType: "exercise",
		variantName: "Barbell Bench Press",
		baseName: "Bench Press",
		movementPattern: "push",
		environment: "gym",
		category: "strength",
		label: "Barbell Bench Press",
	});

	assert.equal(media.src, "/media/exercise-barbell-bench-press.svg");
	assert.equal(media.matchType, "exercise_variant");
	assert.equal(media.matchedKey, "barbell-bench-press");
	assert.equal(media.entityType, "exercise");
	assert.equal(media.isFallback, false);
	assert.equal(media.alt, "Barbell bench press exercise illustration");
});

test("an exercise variant inherits the base exercise media", () => {
	const media = resolveMedia({
		entityType: "exercise",
		variantName: "Dumbbell Bench Press",
		baseName: "Bench Press",
		movementPattern: "push",
		category: "strength",
		label: "Dumbbell Bench Press",
	});

	assert.equal(media.src, "/media/catalog/exercises/bench-press.png");
	assert.equal(media.matchType, "exercise");
	assert.equal(media.matchedKey, "bench-press");
	assert.equal(media.isFallback, true);
	assert.match(media.alt, /^Dumbbell Bench Press — /);
});

test("localized labels use canonical manifest keys without losing translated alt text", () => {
	const media = resolveMedia({
		entityType: "exercise",
		variantName: "Supino com barra",
		baseName: "Supino",
		matchVariantName: "Barbell Bench Press",
		matchBaseName: "Bench Press",
		matchMovementPattern: "Push",
		label: "Supino com barra",
	});

	assert.equal(media.src, "/media/exercise-barbell-bench-press.svg");
	assert.equal(media.matchedKey, "barbell-bench-press");
	assert.equal(media.alt, "Barbell bench press exercise illustration");
});

test("movement and environment fallbacks are selected before category fallback", () => {
	const movement = resolveMedia({
		entityType: "exercise",
		variantName: "Unlisted Press",
		baseName: "Unlisted Exercise",
		movementPattern: "push",
		category: "strength",
		label: "Unlisted Press",
	});
	assert.equal(movement.matchType, "movement_pattern");
	assert.equal(movement.src, "/media/catalog/movement-patterns/push.png");

	const environment = resolveMedia({
		entityType: "exercise",
		variantName: "Outdoor Drill",
		baseName: "Unlisted Exercise",
		environment: "gym",
		category: "strength",
		label: "Outdoor Drill",
	});
	assert.equal(environment.matchType, "environment");
	assert.equal(environment.src, "/media/environment-gym.svg");

	const category = resolveMedia({
		entityType: "exercise",
		variantName: "Unlisted Mobility Drill",
		baseName: "Unlisted Exercise",
		movementPattern: "unlisted-pattern",
		environment: "unlisted-environment",
		category: "mobility",
		label: "Unlisted Mobility Drill",
	});
	assert.equal(category.matchType, "category");
	assert.equal(category.src, "/media/category-mobility.svg");
});

test("missing media resolves to an intentional initial fallback", () => {
	const media = resolveMedia({
		entityType: "exercise",
		variantName: "Unlisted Exercise Variant",
		baseName: "Unlisted Exercise",
		label: "Unlisted Exercise Variant",
	});

	assert.equal(media.src, null);
	assert.equal(media.matchType, "placeholder");
	assert.equal(media.matchedKey, null);
	assert.equal(media.isFallback, true);
	assert.equal(media.presentation, "initial");
	assert.equal(media.initial, "U");
	assert.equal(media.width, 960);
	assert.equal(media.height, 640);
	assert.equal(media.aspectRatio, 1.5);
	assert.equal(media.alt, "Unlisted Exercise Variant — initial tile");
});

test("initial fallback uses the first meaningful letter", () => {
	const media = resolveMedia({
		entityType: "equipment",
		key: "123 dumbbell",
		label: "123 dumbbell",
	});

	assert.equal(media.presentation, "initial");
	assert.equal(media.initial, "D");
});

test("initial presentation suppresses an available image and safely handles an empty label", () => {
	const imageBacked = resolveMedia({
		entityType: "exercise",
		baseName: "Bench Press",
		label: "Bench Press",
		presentation: "initial",
	});
	assert.equal(imageBacked.src, null);
	assert.equal(imageBacked.initial, "B");
	assert.equal(imageBacked.alt, "Bench Press — initial tile");

	const empty = resolveMedia({
		entityType: "session",
		label: "   ",
		presentation: "initial",
	});
	assert.equal(empty.initial, "?");
	assert.equal(empty.alt, "Training content — initial tile");
});

test("non-exercise entities use the same exact-match contract", () => {
	const cases = [
		["muscle", "Chest", "muscle-chest.svg", "muscle"],
		["equipment", "Barbell", "catalog/equipment/barbell.png", "equipment"],
		[
			"movement_pattern",
			"Push",
			"catalog/movement-patterns/push.png",
			"movement_pattern",
		],
		["environment", "Gym", "environment-gym.svg", "environment"],
		["category", "Cardio", "category-cardio.svg", "category"],
	];

	for (const [entityType, key, filename, matchType] of cases) {
		const media = resolveMedia({
			// @ts-expect-error The tuple is intentionally exercising every entity type.
			entityType,
			key,
			label: key,
		});
		assert.equal(media.src, `/media/${filename}`);
		assert.equal(media.matchType, matchType);
		assert.equal(media.isFallback, false);
	}
});

test("manifest validation rejects missing sections and malformed assets", () => {
	assert.throws(
		() => validateMediaManifest({}),
		/Media manifest section is missing: exerciseVariant/,
	);

	const invalidManifest = structuredClone(mediaManifest);
	invalidManifest.category.mobility.src = "https://cdn.example.test/mobility.svg";
	assert.throws(
		() => validateMediaManifest(invalidManifest),
		/Media manifest entry is invalid: category.mobility/,
	);
});
