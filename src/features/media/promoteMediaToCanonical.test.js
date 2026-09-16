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
	assignment = /** @type {{media_asset_id: number, canonical_path: string} | null} */ (
		null
	),
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
			if (text.includes("SELECT media_asset_id, canonical_path")) {
				return { rows: assignment ? [assignment] : [] };
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
					rows: assignAsset
						? [{ id: 100, media_asset_id: values[0], canonical_path: values[4] }]
						: [],
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

function objectStorage(bytes = Buffer.from("remote image"), { exists = true } = {}) {
	const calls = [];
	return {
		calls,
		async exists(storageKey) {
			calls.push(["exists", storageKey]);
			return exists;
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

/** @param {{current?: any, failGet?: boolean, failPut?: boolean, putError?: Error, events?: string[]}} [options] */
function canonicalRegistry({
	current = null,
	failGet = false,
	failPut = false,
	putError,
	events,
} = {}) {
	const calls = [];
	return {
		calls,
		async getCanonicalOverride(entityType, entityKey) {
			calls.push(["get", entityType, entityKey]);
			if (failGet) throw new Error("registry unavailable");
			return current;
		},
		async putCanonicalOverride(entry, options) {
			calls.push(["put", entry, options]);
			events?.push("registry.put");
			if (putError) throw putError;
			if (failPut) throw new Error("registry write failed");
			return { entry, etag: "new-etag" };
		},
		async deleteCanonicalOverride(entityType, entityKey, options) {
			calls.push(["delete", entityType, entityKey, options]);
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
	const db = fakePool({
		asset: remoteAsset,
		assignment: {
			media_asset_id: 8,
			canonical_path: priorRemoteCanonicalEntry.path,
		},
	});
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
		},
	);

	assert.equal(result.status, "promoted");
	assert.equal(result.entry.path, priorRemoteCanonicalEntry.path);
	assert.equal(result.entry.storageKey, objectKey);
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

test("R2-backed promotion persists a stable-key durable registry override", async () => {
	const objectKey = "assets/reviewed-bench-press.png";
	const registry = canonicalRegistry();
	const result = await promoteMediaToCanonical(
		{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
		{
			db: /** @type {any} */ (
				fakePool({ asset: { ...sourceAsset, storage_key: objectKey } })
			),
			objectStorage: /** @type {any} */ (objectStorage()),
			canonicalRegistry: /** @type {any} */ (registry),
		},
	);

	const put = registry.calls.find(([operation]) => operation === "put");
	assert.ok(put);
	assert.equal(put[1].entityType, "exercise");
	assert.equal(put[1].entityKey, "bench-press");
	assert.equal(put[1].asset.objectKey, objectKey);
	assert.equal(put[2].expectedEtag, null);
	assert.equal(result.status, "promoted");
});

test("R2-backed promotion covers every supported entity type and writes durable state first", async () => {
	const cases = /** @type {Array<[string, number, string]>} */ ([
		["exercise", 9, "bench-press"],
		["exercise_variant", 10, "bench-press-barbell"],
		["muscle", 11, "abductors"],
		["equipment", 12, "barbell"],
		["movement_pattern", 13, "push"],
	]);

	for (const [entityType, entityId, entityKey] of cases) {
		const events = [];
		const mediaAssetId = entityId + 100;
		const objectKey = `assets/${entityType}-${entityKey}.png`;
		const registry = canonicalRegistry({ events });
		const db = fakePool({
			asset: { ...sourceAsset, id: mediaAssetId, storage_key: objectKey },
			entityRow: { id: entityId, catalog_key: entityKey },
		});
		const originalConnect = db.connect;
		db.connect = async () => {
			const client = await originalConnect();
			const originalQuery = client.query;
			client.query = async (text, values) => {
				if (text === "COMMIT") events.push("db.commit");
				return originalQuery(text, values);
			};
			return client;
		};

		const result = await promoteMediaToCanonical(
			{ mediaAssetId, entityType, entityId },
			{
				db: /** @type {any} */ (db),
				objectStorage: /** @type {any} */ (objectStorage()),
				canonicalRegistry: /** @type {any} */ (registry),
			},
		);

		assert.equal(result.status, "promoted");
		assert.equal(result.entry.entityType, entityType);
		assert.equal(result.entry.entityKey, entityKey);
		assert.equal(result.entry.storageKey, objectKey);
		assert.equal(registry.calls[1][0], "put");
		assert.equal(registry.calls[1][1].asset.objectKey, objectKey);
		assert.deepEqual(
			db.calls
				.find((call) => call.text.includes("INSERT INTO entity_media"))
				.values.slice(0, 3),
			[mediaAssetId, entityType, entityId],
		);
		assert.ok(events.indexOf("registry.put") < events.indexOf("db.commit"));
	}
});

test("R2-backed promotion rejects a missing object before opening a database transaction", async () => {
	const db = fakePool({ asset: { ...sourceAsset, storage_key: "assets/missing.png" } });
	await assert.rejects(
		() =>
			promoteMediaToCanonical(
				{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
				{
					db: /** @type {any} */ (db),
					objectStorage: /** @type {any} */ (
						objectStorage(Buffer.from("remote image"), { exists: false })
					),
					canonicalRegistry: /** @type {any} */ (canonicalRegistry()),
				},
			),
		(error) =>
			error instanceof MediaCanonicalPromotionError &&
			error.code === "source_file_missing",
	);
	assert.equal(
		db.calls.some((call) => call.text === "BEGIN"),
		false,
	);
});

test("registry failure prevents a successful database-only promotion", async () => {
	const db = fakePool({
		asset: { ...sourceAsset, storage_key: "assets/reviewed.png" },
	});
	await assert.rejects(
		() =>
			promoteMediaToCanonical(
				{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
				{
					db: /** @type {any} */ (db),
					objectStorage: /** @type {any} */ (objectStorage()),
					canonicalRegistry: /** @type {any} */ (canonicalRegistry({ failGet: true })),
				},
			),
		(error) =>
			error instanceof MediaCanonicalPromotionError &&
			error.code === "registry_unavailable",
	);
	assert.equal(
		db.calls.some((call) => call.text === "BEGIN"),
		false,
	);
});

test("registry write failure rolls back the promotion transaction", async () => {
	const db = fakePool({
		asset: { ...sourceAsset, storage_key: "assets/reviewed.png" },
	});
	await assert.rejects(
		() =>
			promoteMediaToCanonical(
				{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
				{
					db: /** @type {any} */ (db),
					objectStorage: /** @type {any} */ (objectStorage()),
					canonicalRegistry: /** @type {any} */ (canonicalRegistry({ failPut: true })),
				},
			),
		(error) =>
			error instanceof MediaCanonicalPromotionError &&
			error.code === "registry_unavailable",
	);
	assert.ok(db.calls.some((call) => call.text === "ROLLBACK"));
	assert.equal(
		db.calls.some((call) => call.text === "COMMIT"),
		false,
	);
});

test("registry concurrency conflicts roll back without reporting success", async () => {
	const conflict = Object.assign(new Error("stale registry"), {
		code: "write_conflict",
	});
	const db = fakePool({
		asset: { ...sourceAsset, storage_key: "assets/reviewed.png" },
	});
	await assert.rejects(
		() =>
			promoteMediaToCanonical(
				{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
				{
					db: /** @type {any} */ (db),
					objectStorage: /** @type {any} */ (objectStorage()),
					canonicalRegistry: /** @type {any} */ (
						canonicalRegistry({ putError: conflict })
					),
				},
			),
		(error) =>
			error instanceof MediaCanonicalPromotionError &&
			error.code === "registry_conflict",
	);
	assert.ok(db.calls.some((call) => call.text === "ROLLBACK"));
	assert.equal(
		db.calls.some((call) => call.text === "COMMIT"),
		false,
	);
});

test("database commit failure compensates a newly written registry override", async () => {
	const registry = canonicalRegistry();
	const db = fakePool({
		asset: { ...sourceAsset, storage_key: "assets/reviewed.png" },
	});
	const originalQuery = db.connect;
	db.connect = async () => {
		const client = await originalQuery();
		const originalClientQuery = client.query;
		client.query = async (text, values) => {
			if (text === "COMMIT") throw new Error("database commit failed");
			return originalClientQuery(text, values);
		};
		return client;
	};

	await assert.rejects(
		() =>
			promoteMediaToCanonical(
				{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
				{
					db: /** @type {any} */ (db),
					objectStorage: /** @type {any} */ (objectStorage()),
					canonicalRegistry: /** @type {any} */ (registry),
				},
			),
		/database commit failed/,
	);
	assert.equal(registry.calls.filter(([operation]) => operation === "put").length, 1);
	assert.equal(
		registry.calls.filter(([operation]) => operation === "delete").length,
		1,
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
	const result = await promoteMediaToCanonical(
		{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
		{
			db: /** @type {any} */ (
				fakePool({
					asset: { ...sourceAsset, storage_key: objectKey },
					assignment: {
						media_asset_id: 7,
						canonical_path: priorRemoteCanonicalEntry.path,
					},
				})
			),
			objectStorage: /** @type {any} */ (remote),
		},
	);

	assert.equal(result.status, "already_canonical");
	assert.deepEqual(remote.calls, []);
});

test("R2-backed promotion supports a muscle asset without duplicating its media row", async () => {
	const objectKey = "assets/reviewed-abductors.jpg";
	const remote = objectStorage(Buffer.from("remote muscle image"));
	const db = fakePool({
		asset: {
			...sourceAsset,
			id: 71,
			storage_key: objectKey,
		},
		entityRow: { id: 22, catalog_key: "abductors" },
		assignment: {
			media_asset_id: 70,
			canonical_path: "/media/catalog/promoted/muscle-abductors.png",
		},
	});

	const result = await promoteMediaToCanonical(
		{ mediaAssetId: 71, entityType: "muscle", entityId: 22 },
		{
			db: /** @type {any} */ (db),
			objectStorage: /** @type {any} */ (remote),
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

test("R2-backed promotion leaves the pre-existing object untouched when the assignment fails", async () => {
	const objectKey = "assets/reviewed-bench-press.png";
	const remoteBytes = Buffer.from("remote image");
	const remote = objectStorage(remoteBytes);
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
				},
			),
		(error) =>
			error instanceof MediaCanonicalPromotionError &&
			error.code === "entity_not_found",
	);

	assert.deepEqual(remote.calls, [
		["exists", objectKey],
		["read", objectKey],
	]);
});

test("promotion copies an eligible asset, replaces the assignment, and records stable canonical state", async () => {
	const db = fakePool();
	const result = await promoteMediaToCanonical(
		{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
		{
			db: /** @type {any} */ (db),
			sourceStorage: /** @type {any} */ (storage()),
			canonicalStorage: /** @type {any} */ (storage(undefined, { exists: false })),
		},
	);

	assert.equal(result.status, "promoted");
	assert.equal(result.entry.entityKey, "bench-press");
	assert.match(
		result.entry.path,
		/^\/media\/catalog\/promoted\/exercise\/exercise-bench-press-/,
	);
	assert.ok(db.calls.some((call) => call.text === "COMMIT"));
	assert.deepEqual(
		db.calls
			.find((call) => call.text.includes("INSERT INTO entity_media"))
			.values.slice(1, 3),
		["exercise", 9],
	);
});

test("object-backed promotion derives a stable path from the catalog key, not the numeric id", async () => {
	const objectKey = "assets/muscle-13-review.png";
	const bytes = Buffer.from("muscle 13 canonical image");
	const remote = objectStorage(bytes);
	const result = await promoteMediaToCanonical(
		{ mediaAssetId: 75, entityType: "muscle", entityId: 13 },
		{
			db: /** @type {any} */ (
				fakePool({
					asset: {
						...sourceAsset,
						id: 75,
						storage_key: objectKey,
					},
					entityRow: { id: 13, catalog_key: "chest" },
				})
			),
			objectStorage: /** @type {any} */ (remote),
		},
	);

	assert.match(result.entry.path, /muscle-chest-/);
	assert.doesNotMatch(result.entry.path, /muscle-13-/);
	assert.equal(result.assignment.canonical_path, result.entry.path);
});

test("promoting the current canonical asset is idempotent and does not copy another file", async () => {
	const canonicalAsset = {
		...sourceAsset,
		storage_key: "/media/catalog/exercises/bench-press.png",
	};
	let copied = false;
	const result = await promoteMediaToCanonical(
		{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
		{
			db: /** @type {any} */ (
				fakePool({
					asset: canonicalAsset,
					assignment: { media_asset_id: 7, canonical_path: canonicalAsset.storage_key },
				})
			),
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
		},
	);

	assert.equal(result.status, "already_canonical");
	assert.equal(copied, false);
});

test("promotion rolls back a copied local file when the database write fails", async () => {
	const destination = storage(undefined, { exists: false });
	await assert.rejects(
		() =>
			promoteMediaToCanonical(
				{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
				{
					db: /** @type {any} */ (fakePool({ createAsset: false })),
					sourceStorage: /** @type {any} */ (storage()),
					canonicalStorage: /** @type {any} */ (destination),
				},
			),
		(error) =>
			error instanceof MediaCanonicalPromotionError &&
			error.code === "asset_create_failed",
	);
	assert.equal(destination.removed, true);
});

test("promotion rejects an unsupported MIME type before persisting canonical state", async () => {
	await assert.rejects(
		() =>
			promoteMediaToCanonical(
				{ mediaAssetId: 7, entityType: "muscle", entityId: 13 },
				{
					db: /** @type {any} */ (
						fakePool({
							asset: { ...sourceAsset, mime_type: "application/pdf" },
							entityRow: { id: 13, catalog_key: "chest" },
						})
					),
				},
			),
		(error) =>
			error instanceof MediaCanonicalPromotionError &&
			error.code === "unsupported_media_type",
	);
});

test("promotion protects an existing deterministic canonical file from conflicting bytes", async () => {
	await assert.rejects(
		() =>
			promoteMediaToCanonical(
				{ mediaAssetId: 7, entityType: "exercise", entityId: 9 },
				{
					db: /** @type {any} */ (fakePool()),
					sourceStorage: /** @type {any} */ (storage(Buffer.from("new bytes"))),
					canonicalStorage: /** @type {any} */ (
						storage(Buffer.from("different bytes"))
					),
				},
			),
		(error) =>
			error instanceof MediaCanonicalPromotionError &&
			error.code === "canonical_file_conflict",
	);
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
