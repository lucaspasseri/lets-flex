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
	assignAsset = true,
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
				return {
					rows: assignAsset ? [{ id: 100, media_asset_id: values[0] }] : [],
				};
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
		async put(_buffer, { extension, filename }) {
			return {
				storageKey: `/media/catalog/promoted/exercise/${filename}.${extension}`,
			};
		},
		async delete() {
			removed = true;
		},
		getPublicUrl(storageKey) {
			return storageKey;
		},
	};
}

function objectStorage(bytes = Buffer.from("remote image")) {
	const calls = [];
	return {
		calls,
		async exists(storageKey) {
			calls.push(["exists", storageKey]);
			return true;
		},
		async read(storageKey) {
			calls.push(["read", storageKey]);
			return Buffer.from(bytes);
		},
		async put() {
			calls.push(["put"]);
			throw new Error("object-backed promotion must not upload");
		},
		async delete(storageKey) {
			calls.push(["delete", storageKey]);
			throw new Error("object-backed promotion must not delete");
		},
		getPublicUrl(storageKey) {
			return `https://media.example.test/${storageKey}`;
		},
	};
}

const priorRemoteCanonicalEntry = {
	entityType: "exercise",
	entityKey: "bench-press",
	path: "/media/catalog/exercises/bench-press.png",
	storageKey: "assets/previous-bench-press.png",
	role: "primary",
	mimeType: "image/png",
	width: 1536,
	height: 1024,
	source: "curated",
	alt: "Bench press",
	altTexts: { en: "Bench press", "pt-BR": "Supino" },
};

test("R2-backed promotion reuses the object key and replaces canonical meaning without copying", async () => {
	const objectKey = "assets/reviewed-bench-press.png";
	const remoteAsset = { ...sourceAsset, storage_key: objectKey };
	const remoteBytes = Buffer.from("remote image");
	const remote = objectStorage(remoteBytes);
	const store = manifestStore([priorRemoteCanonicalEntry]);
	const db = fakePool({ asset: remoteAsset });
	const bytesBefore = await remote.read(objectKey);
	const result = await promoteMediaToCanonical(
		{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
		{
			db: /** @type {any} */ (db),
			objectStorage: /** @type {any} */ (remote),
			sourceStorage: /** @type {any} */ ({
				async read() {
					throw new Error("R2-backed promotion should not read local source");
				},
			}),
			canonicalStorage: /** @type {any} */ ({
				async put() {
					throw new Error(
						"R2-backed promotion should not write local canonical storage",
					);
				},
			}),
			manifestStore: /** @type {any} */ (store),
		},
	);

	assert.equal(result.status, "promoted");
	assert.equal(result.entry.path, priorRemoteCanonicalEntry.path);
	assert.equal(result.entry.storageKey, objectKey);
	assert.deepEqual(await store.current(), [result.entry]);
	assert.deepEqual(result.asset.storage_key, objectKey);
	assert.deepEqual(
		db.calls
			.find((call) => call.text.includes("INSERT INTO entity_media"))
			.values.slice(0, 3),
		[7, "exercise", 9],
	);
	assert.deepEqual(await remote.read(objectKey), bytesBefore);
	assert.equal(
		remote.calls.some(([operation]) => operation === "put"),
		false,
	);
	assert.equal(
		remote.calls.some(([operation]) => operation === "delete"),
		false,
	);
});

test("R2-backed promotion is idempotent when the canonical object key already matches", async () => {
	const objectKey = "assets/reviewed-bench-press.png";
	const calls = /** @type {Array<string>} */ ([]);
	const remote = {
		calls,
		async exists() {
			this.calls.push("exists");
			throw new Error("already-canonical promotion should not read R2");
		},
		async read() {
			this.calls.push("read");
			throw new Error("already-canonical promotion should not read R2");
		},
		async put() {
			this.calls.push("put");
			throw new Error("already-canonical promotion should not upload");
		},
		async delete() {
			this.calls.push("delete");
			throw new Error("already-canonical promotion should not delete");
		},
		getPublicUrl(storageKey) {
			return storageKey;
		},
	};
	const store = manifestStore([
		{ ...priorRemoteCanonicalEntry, storageKey: objectKey },
	]);
	const result = await promoteMediaToCanonical(
		{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
		{
			db: /** @type {any} */ (
				fakePool({ asset: { ...sourceAsset, storage_key: objectKey } })
			),
			objectStorage: /** @type {any} */ (remote),
			manifestStore: /** @type {any} */ (store),
		},
	);

	assert.equal(result.status, "already_canonical");
	assert.deepEqual(remote.calls, []);
});

test("R2-backed promotion supports a muscle asset without duplicating its media row", async () => {
	const objectKey = "assets/reviewed-abductors.jpg";
	const remote = objectStorage(Buffer.from("remote muscle image"));
	const store = manifestStore([
		{
			...priorRemoteCanonicalEntry,
			entityType: "muscle",
			entityKey: "abductors",
			path: "/media/catalog/promoted/muscle-abductors.png",
		},
	]);
	const db = fakePool({
		asset: {
			...sourceAsset,
			id: 71,
			storage_key: objectKey,
		},
		entityRow: { id: 22, catalog_key: "abductors" },
	});

	const result = await promoteMediaToCanonical(
		{ mediaAssetId: 71, entityType: "muscle", entityId: 22 },
		{
			db: /** @type {any} */ (db),
			objectStorage: /** @type {any} */ (remote),
			manifestStore: /** @type {any} */ (store),
		},
	);

	assert.equal(result.status, "promoted");
	assert.equal(result.asset.id, 71);
	assert.equal(result.entry.storageKey, objectKey);
	assert.deepEqual(
		db.calls.filter((call) => call.text.includes("INSERT INTO media_assets")),
		[],
	);
	assert.deepEqual(
		db.calls
			.find((call) => call.text.includes("INSERT INTO entity_media"))
			.values.slice(0, 3),
		[71, "muscle", 22],
	);
});

test("R2-backed promotion compensates manifest changes without deleting the pre-existing object", async () => {
	const objectKey = "assets/reviewed-bench-press.png";
	const remoteBytes = Buffer.from("remote image");
	const remote = objectStorage(remoteBytes);
	const store = manifestStore([priorRemoteCanonicalEntry]);
	await assert.rejects(
		() =>
			promoteMediaToCanonical(
				{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
				{
					db: /** @type {any} */ (
						fakePool({
							asset: { ...sourceAsset, storage_key: objectKey },
							assignAsset: false,
						})
					),
					objectStorage: /** @type {any} */ (remote),
					manifestStore: /** @type {any} */ (store),
				},
			),
		(error) =>
			error instanceof MediaCanonicalPromotionError &&
			error.code === "entity_not_found",
	);

	assert.deepEqual(await store.current(), [priorRemoteCanonicalEntry]);
	assert.equal(store.writes.length, 1);
	assert.deepEqual(remote.calls, [
		["exists", objectKey],
		["read", objectKey],
	]);
});

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
				async put() {
					copied = true;
					return { storageKey: "/media/catalog/promoted/exercise/ignored.png" };
				},
				async delete() {},
				async exists() {
					return false;
				},
				async read() {
					return Buffer.alloc(0);
				},
				getPublicUrl(storageKey) {
					return storageKey;
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
