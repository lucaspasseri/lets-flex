import assert from "node:assert/strict";
import test from "node:test";

import {
	MediaCanonicalPromotionError,
	promoteMediaToCanonical,
} from "./promoteMediaToCanonical.js";

const entity = { id: 9, catalog_key: "bench-press" };
const sourceAsset = {
	id: 7,
	storage_key: "/media/uploads/reviewed.png",
	mime_type: "image/png",
	width: 640,
	height: 480,
	alt_text: "Bench press",
	alt_texts: { en: "Bench press", "pt-BR": "Supino" },
};

function fakePool({
	asset = sourceAsset,
	entityRow = entity,
	createAsset = true,
} = {}) {
	const calls = [];
	const client = {
		async query(text, values) {
			calls.push({ text, values });
			if (["BEGIN", "COMMIT", "ROLLBACK"].includes(text)) return { rows: [] };
			if (text.includes("SELECT entity.id, entity.catalog_key")) {
				return { rows: entityRow ? [entityRow] : [] };
			}
			if (
				text.includes("FROM media_assets") &&
				text.includes("WHERE media_assets.id")
			) {
				return { rows: asset ? [asset] : [] };
			}
			if (text.includes("INSERT INTO media_assets")) {
				return {
					rows: createAsset
						? [{ id: 99, storage_key: values[0], mime_type: values[1] }]
						: [],
				};
			}
			if (text.includes("INSERT INTO entity_media")) {
				return { rows: [{ id: 100, media_asset_id: values[0] }] };
			}
			if (text.includes("INSERT INTO media_asset_alt_texts"))
				return { rows: [{ id: 1 }] };
			if (text.includes("DELETE FROM media_asset_alt_texts")) return { rows: [] };
			throw new Error(`Unexpected query: ${text}`);
		},
		release() {
			calls.push({ text: "RELEASE" });
		},
	};
	return {
		calls,
		async query(text, values) {
			return client.query(text, values);
		},
		async connect() {
			return client;
		},
	};
}

function manifestStore(initial = []) {
	let current = structuredClone(initial);
	const writes = [];
	return {
		writes,
		async read() {
			return structuredClone(current);
		},
		async update(callback) {
			const previous = structuredClone(current);
			current = await callback(structuredClone(current));
			return { previous, manifest: structuredClone(current) };
		},
		async write(next) {
			current = structuredClone(next);
			writes.push(structuredClone(next));
		},
		async current() {
			return structuredClone(current);
		},
	};
}

function storage(bytes = Buffer.from("reviewed image"), { exists = true } = {}) {
	let removed = false;
	return {
		get removed() {
			return removed;
		},
		async exists() {
			return exists;
		},
		async read() {
			return bytes;
		},
		async save(_buffer, { extension, filename }) {
			return {
				storageKey: `/media/catalog/promoted/exercise/${filename}.${extension}`,
				async remove() {
					removed = true;
				},
			};
		},
	};
}

test("promotion copies an eligible asset, replaces the assignment, and records stable canonical state", async () => {
	const db = fakePool();
	const store = manifestStore();
	const result = await promoteMediaToCanonical(
		{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
		{
			db: /** @type {any} */ (db),
			sourceStorage: /** @type {any} */ (storage()),
			canonicalStorage: /** @type {any} */ (storage(undefined, { exists: false })),
			manifestStore: /** @type {any} */ (store),
		},
	);

	assert.equal(result.status, "promoted");
	assert.equal(result.entry.entityKey, "bench-press");
	assert.match(
		result.entry.path,
		/^\/media\/catalog\/promoted\/exercise\/exercise-bench-press-/,
	);
	assert.equal((await store.current()).length, 1);
	assert.ok(db.calls.some((call) => call.text === "COMMIT"));
	assert.deepEqual(
		db.calls
			.find((call) => call.text.includes("INSERT INTO entity_media"))
			.values.slice(1, 3),
		["exercise", 9],
	);
});

test("promotion replaces only the selected entity's prior canonical manifest entry", async () => {
	const oldEntry = {
		entityType: "exercise",
		entityKey: "bench-press",
		path: "/media/catalog/exercises/bench-press.png",
		role: "primary",
		mimeType: "image/png",
		width: 1536,
		height: 1024,
		source: "curated",
		alt: "Bench press",
		altTexts: { en: "Bench press", "pt-BR": "Supino" },
	};
	const otherEntry = {
		...oldEntry,
		entityKey: "row",
		path: "/media/catalog/exercises/row.png",
	};
	const store = manifestStore([oldEntry, otherEntry]);
	const result = await promoteMediaToCanonical(
		{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
		{
			db: /** @type {any} */ (fakePool()),
			sourceStorage: /** @type {any} */ (storage()),
			canonicalStorage: /** @type {any} */ (storage(undefined, { exists: false })),
			manifestStore: /** @type {any} */ (store),
		},
	);

	const manifest = await store.current();
	assert.equal(manifest.length, 2);
	assert.equal(
		manifest.find((entry) => entry.entityKey === "row").path,
		otherEntry.path,
	);
	assert.equal(
		manifest.find((entry) => entry.entityKey === "bench-press").path,
		result.entry.path,
	);
});

test("promoting the current canonical asset is idempotent and does not copy another file", async () => {
	const canonicalAsset = {
		...sourceAsset,
		storage_key: "/media/catalog/exercises/bench-press.png",
	};
	const store = manifestStore([
		{
			entityType: "exercise",
			entityKey: "bench-press",
			path: canonicalAsset.storage_key,
			role: "primary",
			mimeType: "image/png",
			width: 640,
			height: 480,
			source: "curated",
			alt: "Bench press",
			altTexts: { en: "Bench press", "pt-BR": "Supino" },
		},
	]);
	let copied = false;
	const result = await promoteMediaToCanonical(
		{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
		{
			db: /** @type {any} */ (fakePool({ asset: canonicalAsset })),
			sourceStorage: /** @type {any} */ ({
				async exists() {
					throw new Error("source should not be read");
				},
			}),
			canonicalStorage: /** @type {any} */ ({
				async save() {
					copied = true;
				},
			}),
			manifestStore: /** @type {any} */ (store),
		},
	);

	assert.equal(result.status, "already_canonical");
	assert.equal(copied, false);
});

test("promotion rolls back the manifest and copied file when the database write fails", async () => {
	const store = manifestStore();
	const destination = storage(undefined, { exists: false });
	await assert.rejects(
		() =>
			promoteMediaToCanonical(
				{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
				{
					db: /** @type {any} */ (fakePool({ createAsset: false })),
					sourceStorage: /** @type {any} */ (storage()),
					canonicalStorage: /** @type {any} */ (destination),
					manifestStore: /** @type {any} */ (store),
				},
			),
		(error) =>
			error instanceof MediaCanonicalPromotionError &&
			error.code === "asset_create_failed",
	);
	assert.equal((await store.current()).length, 0);
	assert.equal(store.writes.length, 1);
	assert.equal(destination.removed, true);
});

test("promotion rejects unsupported types and entities without stable keys before writing", async () => {
	await assert.rejects(
		() =>
			promoteMediaToCanonical({
				mediaAssetId: 7,
				entityType: "environment",
				entityId: 9,
			}),
		(error) =>
			error instanceof MediaCanonicalPromotionError &&
			error.code === "unsupported_entity_type",
	);
	await assert.rejects(
		() =>
			promoteMediaToCanonical(
				{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
				{
					db: /** @type {any} */ (
						fakePool({
							entityRow: /** @type {any} */ ({ id: 9, catalog_key: null }),
						})
					),
				},
			),
		(error) =>
			error instanceof MediaCanonicalPromotionError &&
			error.code === "entity_key_missing",
	);
});
