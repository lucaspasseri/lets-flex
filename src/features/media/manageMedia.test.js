import assert from "node:assert/strict";
import test from "node:test";

import {
	assignExistingMedia,
	createAndAssignUploadedMedia,
	MediaManagementNotFoundError,
	MediaManagementValidationError,
	removeAssignedMedia,
} from "./manageMedia.js";

function pngFixture() {
	const buffer = Buffer.alloc(45);
	Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
	buffer.writeUInt32BE(13, 8);
	buffer.write("IHDR", 12, "ascii");
	buffer.writeUInt32BE(640, 16);
	buffer.writeUInt32BE(480, 20);
	buffer.write("IEND", 37, "ascii");
	return buffer;
}

function fakePool(queryResults) {
	const calls = [];
	const client = {
		async query(text, values) {
			calls.push({ text, values });
			if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK")
				return { rows: [] };
			const rows = queryResults.shift() ?? [];
			return { rows, rowCount: rows.length };
		},
		release() {
			calls.push({ text: "RELEASE" });
		},
	};
	return {
		calls,
		async connect() {
			return client;
		},
	};
}

test("uploaded media is persisted and assigned atomically through generated storage", async () => {
	const db = fakePool([
		[{ id: 7, storage_key: "/media/uploads/generated.png" }],
		[],
		[],
		[],
		[{ id: 12, media_asset_id: 7, entity_type: "exercise", entity_id: 9 }],
	]);
	const storageCalls = [];
	const storage = {
		async put(buffer, metadata) {
			storageCalls.push({ buffer, metadata });
			return { storageKey: "/media/uploads/generated.png" };
		},
		async delete() {},
		async exists() {
			return true;
		},
		async read() {
			return Buffer.alloc(0);
		},
		getPublicUrl(storageKey) {
			return storageKey;
		},
	};

	const result = await createAndAssignUploadedMedia(
		{
			entityType: "exercise",
			entityId: 9,
			file: {
				buffer: pngFixture(),
				mimetype: "image/png",
				originalname: "bench.png",
			},
			altTexts: { en: "Barbell bench press", "pt-BR": "Supino reto com barra" },
		},
		{ db: /** @type {any} */ (db), storage: /** @type {any} */ (storage) },
	);

	assert.equal(result.asset.id, 7);
	assert.equal(result.assignment.id, 12);
	assert.deepEqual(storageCalls[0].metadata, { extension: "png" });
	assert.equal(db.calls.at(-2).text, "COMMIT");
	assert.equal(db.calls.at(-1).text, "RELEASE");
});

test("failed assignment rolls back and cleans the newly stored file", async () => {
	const db = fakePool([[{ id: 7 }], [], [], []]);
	let removed = false;
	const storage = {
		async put() {
			return { storageKey: "/media/uploads/generated.png" };
		},
		async delete() {
			removed = true;
		},
		async exists() {
			return true;
		},
		async read() {
			return Buffer.alloc(0);
		},
		getPublicUrl(storageKey) {
			return storageKey;
		},
	};

	await assert.rejects(
		() =>
			createAndAssignUploadedMedia(
				{
					entityType: "exercise",
					entityId: 999,
					file: {
						buffer: pngFixture(),
						mimetype: "image/png",
						originalname: "bench.png",
					},
				},
				{ db: /** @type {any} */ (db), storage: /** @type {any} */ (storage) },
			),
		(error) => error instanceof MediaManagementNotFoundError,
	);
	assert.equal(removed, true);
	assert.ok(db.calls.some((call) => call.text === "ROLLBACK"));
});

test("existing asset assignment replaces the target without creating a duplicate", async () => {
	const db = fakePool([
		[{ id: 7, storage_key: "/media/uploads/existing.png" }],
		[{ id: 13, media_asset_id: 7, entity_type: "equipment", entity_id: 2 }],
	]);
	const result = await assignExistingMedia(
		{ mediaAssetId: 7, entityType: "equipment", entityId: 2 },
		{ db: /** @type {any} */ (db) },
	);

	assert.equal(result.asset.id, 7);
	assert.equal(result.assignment.id, 13);
	assert.equal(db.calls.filter((call) => call.text.includes("media_assets")).length, 1);
	assert.ok(db.calls.some((call) => call.text === "COMMIT"));
});

test("removing an assignment is transactional and leaves the reusable asset untouched", async () => {
	const db = fakePool([[{ id: 3 }], []]);
	const result = await removeAssignedMedia(
		{ entityType: "muscle", entityId: 3 },
		{ db: /** @type {any} */ (db) },
	);

	assert.deepEqual(result, { entityType: "muscle", entityId: 3 });
	assert.match(db.calls[2].text, /DELETE FROM entity_media/);
	assert.doesNotMatch(db.calls[2].text, /media_assets/);
});

test("management inputs reject unsupported entities and malformed alt text before database access", async () => {
	const db = fakePool([]);
	await assert.rejects(
		() =>
			assignExistingMedia(
				{ mediaAssetId: 7, entityType: "environment", entityId: 2 },
				{ db: /** @type {any} */ (db) },
			),
		(error) =>
			error instanceof MediaManagementValidationError &&
			error.code === "unsupported_entity_type",
	);
	await assert.rejects(
		() =>
			assignExistingMedia(
				{
					mediaAssetId: 7,
					entityType: "exercise",
					entityId: 2,
					altTexts: { en: "x".repeat(501) },
				},
				{ db: /** @type {any} */ (db) },
			),
		(error) =>
			error instanceof MediaManagementValidationError &&
			error.code === "invalid_alt_text",
	);
	assert.equal(db.calls.length, 0);
});
