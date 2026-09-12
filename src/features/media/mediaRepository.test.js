import assert from "node:assert/strict";
import test from "node:test";

import {
	assertAssignableMediaEntityType,
	assignPrimaryMedia,
	createMediaAsset,
	findPrimaryMediaAssignments,
	removePrimaryMedia,
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
		{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
		/** @type {any} */ (db),
	);

	assert.equal(result.id, 3);
	assert.match(db.calls[0].text, /FROM exercises AS entity/);
	assert.match(db.calls[0].text, /ON CONFLICT \(entity_type, entity_id, role\)/);
	assert.deepEqual(db.calls[0].values, [7, "exercise", 9, 0]);

	assert.throws(
		() =>
			assertAssignableMediaEntityType(
				/** @type {any} */ ("sessions; DROP TABLE media_assets"),
			),
		/unsupported entity type/,
	);
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
