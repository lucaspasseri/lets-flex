import assert from "node:assert/strict";
import test from "node:test";

import {
	assertAssignableMediaEntityType,
	assignPrimaryMedia,
	createMediaAsset,
	findMediaAssetById,
	findMediaAssets,
	findPrimaryMediaAssignment,
	findPrimaryMediaAssignments,
	mediaEntityExists,
	removePrimaryMedia,
	replaceMediaAssetAltTexts,
} from "./mediaRepository.js";

function fakeDatabase(rows = []) {
	const calls = [];
	return {
		calls,
		async query(text, values) {
			calls.push({ text, values });
			return { rows };
		},
	};
}

test("media asset creation trims optional metadata at the persistence boundary", async () => {
	const db = fakeDatabase([{ id: 7, storage_key: "/media/bench.svg" }]);
	const result = await createMediaAsset(
		{
			storageKey: " /media/bench.svg ",
			mimeType: " image/svg+xml ",
			width: 960,
			height: 640,
			source: " curated ",
			altText: " Bench press illustration ",
		},
		/** @type {any} */ (db),
	);

	assert.equal(result.id, 7);
	assert.deepEqual(db.calls[0].values, [
		"/media/bench.svg",
		"image/svg+xml",
		960,
		640,
		"curated",
		"Bench press illustration",
	]);
});

test("primary assignment is replaceable and validates the entity table from a fixed allowlist", async () => {
	const db = fakeDatabase([{ id: 3, entity_type: "exercise", entity_id: 9 }]);
	const result = await assignPrimaryMedia(
		{
			mediaAssetId: 7,
			entityType: "exercise",
			entityId: 9,
			canonicalPath: "/media/catalog/promoted/exercise-bench-press-deadbeef.png",
		},
		/** @type {any} */ (db),
	);

	assert.equal(result.id, 3);
	assert.match(db.calls[0].text, /FROM exercises AS entity/);
	assert.match(db.calls[0].text, /ON CONFLICT \(entity_type, entity_id, role\)/);
	assert.deepEqual(db.calls[0].values, [
		7,
		"exercise",
		9,
		0,
		"/media/catalog/promoted/exercise-bench-press-deadbeef.png",
	]);

	assert.throws(
		() =>
			assertAssignableMediaEntityType(
				/** @type {any} */ ("sessions; DROP TABLE media_assets"),
			),
		/unsupported entity type/,
	);
});

test("canonical assignment lookup reads the persisted compatibility path", async () => {
	const db = fakeDatabase([
		{
			media_asset_id: 7,
			canonical_path: "/media/catalog/exercises/bench-press.png",
		},
	]);
	const assignment = await findPrimaryMediaAssignment(
		{ entityType: "exercise", entityId: 9 },
		/** @type {any} */ (db),
	);

	assert.deepEqual(assignment, {
		media_asset_id: 7,
		canonical_path: "/media/catalog/exercises/bench-press.png",
	});
	assert.match(db.calls[0].text, /canonical_path/);
});

test("assignment lookup batches candidates and removal only removes the assignment", async () => {
	const db = fakeDatabase([
		{
			entity_type: "exercise",
			entity_id: 9,
			storage_key: "/media/exercise.svg",
			width: 960,
			height: 640,
		},
	]);
	const rows = await findPrimaryMediaAssignments(
		[
			{ entityType: "exercise_variant", entityId: 10 },
			{ entityType: "exercise", entityId: 9 },
		],
		/** @type {any} */ (db),
	);

	assert.equal(rows.length, 1);
	assert.deepEqual(db.calls[0].values, [
		["exercise_variant", "exercise"],
		[10, 9],
	]);

	await removePrimaryMedia(
		{ entityType: "exercise", entityId: 9 },
		/** @type {any} */ (db),
	);
	assert.match(db.calls[1].text, /DELETE FROM entity_media/);
	assert.doesNotMatch(db.calls[1].text, /media_assets/);
});

test("empty candidate lookup does not query the database", async () => {
	const db = fakeDatabase();
	assert.deepEqual(await findPrimaryMediaAssignments([], /** @type {any} */ (db)), []);
	assert.equal(db.calls.length, 0);
});

test("localized asset metadata can be replaced without duplicating the asset", async () => {
	const db = fakeDatabase([
		{ id: 7, alt_texts: { en: "Bench press", "pt-BR": "Supino" } },
	]);
	await replaceMediaAssetAltTexts(
		{
			mediaAssetId: 7,
			altTexts: { en: " Bench press ", "pt-BR": "Supino" },
		},
		/** @type {any} */ (db),
	);

	assert.match(db.calls[0].text, /DELETE FROM media_asset_alt_texts/);
	assert.deepEqual(db.calls[0].values, [7]);
	assert.equal(db.calls.length, 3);
	assert.deepEqual(db.calls[1].values, [7, "en", "Bench press"]);
	assert.deepEqual(db.calls[2].values, [7, "pt-BR", "Supino"]);
});

test("asset lookup returns localized metadata through the media repository boundary", async () => {
	const db = fakeDatabase([{ id: 7, alt_texts: { en: "Bench press" } }]);
	const asset = await findMediaAssetById(7, /** @type {any} */ (db));

	assert.deepEqual(asset.alt_texts, { en: "Bench press" });
	assert.match(db.calls[0].text, /jsonb_object_agg/);
	assert.deepEqual(db.calls[0].values, [7]);
});

test("asset listing is bounded before the limit reaches SQL", async () => {
	const db = fakeDatabase([{ id: 7 }]);
	const assets = await findMediaAssets({ limit: 1000 }, /** @type {any} */ (db));

	assert.deepEqual(assets, [{ id: 7 }]);
	assert.deepEqual(db.calls[0].values, [100]);
});

test("entity existence checks use the fixed supported-table allowlist", async () => {
	const db = {
		async query(text, values) {
			assert.match(text, /FROM equipments AS entity/);
			assert.deepEqual(values, [2]);
			return { rowCount: 1 };
		},
	};

	assert.equal(
		await mediaEntityExists(
			{ entityType: "equipment", entityId: 2 },
			/** @type {any} */ (db),
		),
		true,
	);
});
