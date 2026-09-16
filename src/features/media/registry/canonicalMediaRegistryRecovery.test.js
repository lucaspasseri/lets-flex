import assert from "node:assert/strict";
import test from "node:test";

import {
	CanonicalRegistryPreflightError,
	CanonicalRegistryVerificationError,
	getResetCatalogDefinitions,
	preflightCanonicalRegistry,
	restoreCanonicalRegistry,
	verifyCanonicalRegistryRestoration,
} from "./canonicalMediaRegistryRecovery.js";
import createMediaResolver from "../createMediaResolver.js";
import resolveStepMedia from "../resolveStepMedia.js";

const entry =
	/** @type {import("./canonicalMediaRegistrySchema.js").CanonicalRegistryEntry} */ ({
		schemaVersion: 1,
		entityType: "exercise",
		entityKey: "push-up",
		role: "canonical",
		asset: {
			objectKey: "assets/promoted-push-up.webp",
			mimeType: "image/webp",
			width: 10,
			height: 20,
		},
		canonicalPath: "/media/catalog/promoted/exercise/push-up.webp",
		alt: { en: "Push-up", "pt-BR": "Flexão" },
		updatedAt: "2026-09-16T00:00:00.000Z",
	});

function registry(entries = [entry]) {
	return /** @type {any} */ ({
		async listCanonicalOverrides() {
			return entries.map((value) => ({ entry: value, etag: "etag" }));
		},
	});
}

function mediaStorage({ exists = true, fail = false } = {}) {
	const calls = [];
	return {
		calls,
		async exists(objectKey) {
			calls.push(objectKey);
			if (fail) throw new Error("media storage unavailable");
			return exists;
		},
	};
}

test("reset preflight accepts valid stable-key entries and checks their R2 objects", async () => {
	const storage = mediaStorage();
	const result = await preflightCanonicalRegistry({
		registry: registry(),
		mediaStorage: storage,
	});
	assert.deepEqual(result.summary, { count: 1 });
	assert.deepEqual(result.entries, [entry]);
	assert.deepEqual(storage.calls, [entry.asset.objectKey]);
	assert.ok(getResetCatalogDefinitions().exercise.has("push-up"));
});

test("reset preflight rejects missing objects, missing catalog keys, and duplicate identities", async () => {
	await assert.rejects(
		() =>
			preflightCanonicalRegistry({
				registry: registry(),
				mediaStorage: mediaStorage({ exists: false }),
			}),
		(error) =>
			error instanceof CanonicalRegistryPreflightError &&
			error.issues.some((issue) => issue.reason.includes("media object is missing")),
	);
	await assert.rejects(
		() =>
			preflightCanonicalRegistry({
				registry: registry([{ ...entry, entityKey: "removed-exercise" }]),
				mediaStorage: mediaStorage(),
			}),
		(error) =>
			error instanceof CanonicalRegistryPreflightError &&
			error.issues.some((issue) => issue.reason.includes("absent from the reset seed")),
	);
	await assert.rejects(
		() =>
			preflightCanonicalRegistry({
				registry: registry([entry, entry]),
				mediaStorage: mediaStorage(),
			}),
		(error) =>
			error instanceof CanonicalRegistryPreflightError &&
			error.issues.some((issue) =>
				issue.reason.includes("duplicate registry identity"),
			),
	);
});

test("reset preflight turns registry and media failures into an abortable error", async () => {
	await assert.rejects(
		() =>
			preflightCanonicalRegistry({
				registry: /** @type {any} */ ({
					async listCanonicalOverrides() {
						throw new Error("credentials rejected");
					},
				}),
				mediaStorage: mediaStorage(),
			}),
		CanonicalRegistryPreflightError,
	);
	await assert.rejects(
		() =>
			preflightCanonicalRegistry({
				registry: registry(),
				mediaStorage: mediaStorage({ fail: true }),
			}),
		(error) =>
			error instanceof CanonicalRegistryPreflightError &&
			error.issues.some((issue) => issue.reason.includes("could not be verified")),
	);
	await assert.rejects(
		() =>
			preflightCanonicalRegistry({
				registry: registry([/** @type {any} */ ({})]),
				mediaStorage: mediaStorage(),
			}),
		CanonicalRegistryPreflightError,
	);
});

test("registry restoration resolves stable keys and is idempotent through SQL upserts", async () => {
	const calls = [];
	const db = {
		async query(text, values) {
			calls.push({ text, values });
			if (text.includes("SELECT entity.id, entity.catalog_key"))
				return { rows: [{ id: 41, catalog_key: "push-up" }] };
			if (text.includes("INSERT INTO media_assets"))
				return { rows: [{ id: 88, storage_key: entry.asset.objectKey }] };
			if (text.includes("INSERT INTO media_asset_alt_texts"))
				return { rows: [{ id: 1 }] };
			if (text.includes("DELETE FROM media_asset_alt_texts")) return { rows: [] };
			if (text.includes("INSERT INTO entity_media")) return { rows: [{ id: 2 }] };
			throw new Error(`Unexpected query: ${text}`);
		},
	};

	assert.deepEqual(
		await restoreCanonicalRegistry({ entries: [entry], db: /** @type {any} */ (db) }),
		{
			count: 1,
		},
	);
	assert.deepEqual(
		await restoreCanonicalRegistry({ entries: [entry], db: /** @type {any} */ (db) }),
		{
			count: 1,
		},
	);
	assert.equal(
		calls.filter((call) => call.text.includes("INSERT INTO media_assets")).length,
		2,
	);
	assert.equal(
		calls.filter((call) => call.text.includes("ON CONFLICT (storage_key)")).length,
		2,
	);
	assert.equal(
		calls.filter((call) =>
			call.text.includes("ON CONFLICT (entity_type, entity_id, role)"),
		).length,
		2,
	);
	assert.equal(
		calls.some((call) => call.values?.includes(41)),
		true,
	);
});

test("a restored base override is consumed by an unchanged starter-workout step", async () => {
	const assignments = [];
	const db = {
		async query(text, values) {
			if (text.includes("SELECT entity.id, entity.catalog_key"))
				return { rows: [{ id: 41, catalog_key: "push-up" }] };
			if (text.includes("INSERT INTO media_assets"))
				return { rows: [{ id: 88, storage_key: entry.asset.objectKey }] };
			if (text.includes("INSERT INTO media_asset_alt_texts"))
				return { rows: [{ id: 1 }] };
			if (text.includes("DELETE FROM media_asset_alt_texts")) return { rows: [] };
			if (text.includes("INSERT INTO entity_media")) {
				assignments.push({
					entity_type: values[1],
					entity_id: values[2],
					media_asset_id: values[0],
					canonical_path: values[4],
					storage_key: entry.asset.objectKey,
					width: entry.asset.width,
					height: entry.asset.height,
					alt_text_en: entry.alt.en,
					alt_text_pt_br: entry.alt["pt-BR"],
				});
				return { rows: [{ id: 2 }] };
			}
			throw new Error(`Unexpected query: ${text}`);
		},
	};
	await restoreCanonicalRegistry({ entries: [entry], db: /** @type {any} */ (db) });

	const media = resolveStepMedia(
		/** @type {any} */ ({
			exerciseVariantId: 11,
			exerciseId: 41,
			movementPatternId: 20,
			type: "exercise",
			movementPattern: "Push",
			canonicalMovementPattern: "push",
			exercise: {
				name: "Push-up",
				canonicalName: "push-up",
				variantName: "Bodyweight Push-up",
				canonicalVariantName: "bodyweight-push-up",
				environment: null,
			},
		}),
		{ resolveMedia: createMediaResolver(assignments) },
	);
	assert.equal(media.src, entry.asset.objectKey);
	assert.equal(media.matchType, "exercise");
});

test("post-restore verification requires every durable field to match", async () => {
	const db = {
		async query() {
			return {
				rows: [
					{
						id: 41,
						catalog_key: entry.entityKey,
						media_asset_id: 88,
						storage_key: entry.asset.objectKey,
						canonical_path: entry.canonicalPath,
						mime_type: entry.asset.mimeType,
						width: entry.asset.width,
						height: entry.asset.height,
						alt_text_en: entry.alt.en,
						alt_text_pt_br: entry.alt["pt-BR"],
					},
				],
			};
		},
	};
	assert.deepEqual(
		await verifyCanonicalRegistryRestoration({
			entries: [entry],
			db: /** @type {any} */ (db),
		}),
		{ count: 1 },
	);

	const mismatchedDb = {
		async query() {
			return {
				rows: [
					{
						storage_key: "assets/other.webp",
						canonical_path: entry.canonicalPath,
						mime_type: entry.asset.mimeType,
						width: entry.asset.width,
						height: entry.asset.height,
						alt_text_en: entry.alt.en,
						alt_text_pt_br: entry.alt["pt-BR"],
					},
				],
			};
		},
	};
	await assert.rejects(
		verifyCanonicalRegistryRestoration({
			entries: [entry],
			db: /** @type {any} */ (mismatchedDb),
		}),
		(error) =>
			error instanceof CanonicalRegistryVerificationError &&
			error.issues.some((issue) => issue.reason.includes("storage_key")),
	);
});
