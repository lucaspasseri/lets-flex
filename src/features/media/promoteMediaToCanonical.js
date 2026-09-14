import { createHash } from "node:crypto";

import pool from "../../../db/pool.js";
import {
	assignPrimaryMedia,
	createMediaAsset,
	findMediaAssetById,
	findMediaEntityCatalogRecord,
	replaceMediaAssetAltTexts,
} from "./mediaRepository.js";
import {
	createCanonicalMediaManifestStore,
	defaultCanonicalMediaManifestPath,
} from "./canonicalMediaManifestStore.js";
import { normalizeMediaObjectKey } from "./storage/mediaObjectKey.js";
import { assertMediaStorage } from "./storage/storage.js";

/** @typedef {import("pg").Pool} DatabasePool */
/** @typedef {import("pg").PoolClient} DatabaseClient */
/** @typedef {import("./media.types.js").CanonicalMediaManifestEntry} CanonicalMediaManifestEntry */
/** @typedef {{storageKey: string}} StoredMedia */
/** @typedef {{previous: ReadonlyArray<CanonicalMediaManifestEntry>, manifest: ReadonlyArray<CanonicalMediaManifestEntry>}} ManifestChange */
/** @typedef {import("./storage/storage.js").MediaStorage} MediaStorage */
/** @typedef {"exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern"} MediaAssignableEntityType */

const SUPPORTED_ENTITY_TYPES = new Set([
	"exercise",
	"exercise_variant",
	"muscle",
	"equipment",
	"movement_pattern",
]);
const SUPPORTED_MIME_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/svg+xml",
]);
const MIME_EXTENSIONS = Object.freeze({
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
	"image/svg+xml": "svg",
});
const CANONICAL_STORAGE_PREFIX = "/media/catalog/promoted";
const defaultManifestStore = createCanonicalMediaManifestStore({
	filePath: defaultCanonicalMediaManifestPath,
});

export class MediaCanonicalPromotionError extends Error {
	/** @param {string} code @param {string} message */
	constructor(code, message) {
		super(message);
		this.name = "MediaCanonicalPromotionError";
		this.code = code;
	}
}

/**
 * Promote a valid managed asset into the repository-controlled canonical media state. The copied
 * object and manifest update are compensated if the database transaction fails; old assets and
 * files are never deleted because they may remain reusable elsewhere.
 *
 * @param {{mediaAssetId: number, entityType: string, entityId: number, altTexts?: Partial<Record<"en" | "pt-BR", string>>}} input
 * @param {{db?: DatabasePool, objectStorage?: MediaStorage, sourceStorage?: MediaStorage, canonicalStorage?: MediaStorage, manifestStore?: ReturnType<typeof createCanonicalMediaManifestStore>}} [dependencies]
 */
export async function promoteMediaToCanonical(input, dependencies = {}) {
	const entityType = validateEntityType(input.entityType);
	const entityId = validatePositiveInteger(input.entityId, "entity");
	const mediaAssetId = validatePositiveInteger(input.mediaAssetId, "media asset");
	const db = dependencies.db ?? pool;
	const manifestStore = dependencies.manifestStore ?? defaultManifestStore;

	const initialEntity = await findMediaEntityCatalogRecord(
		{ entityType, entityId },
		db,
	);
	if (!initialEntity)
		throw new MediaCanonicalPromotionError("entity_not_found", "entity");
	if (
		typeof initialEntity.catalog_key !== "string" ||
		initialEntity.catalog_key.trim() === ""
	) {
		throw new MediaCanonicalPromotionError(
			"entity_key_missing",
			"This entity does not have a stable catalog key and cannot become canonical.",
		);
	}
	const initialAsset = await findMediaAssetById(mediaAssetId, db);
	if (!initialAsset)
		throw new MediaCanonicalPromotionError("asset_not_found", "media asset");
	const altTexts = canonicalAltTexts(initialAsset, input.altTexts);
	const currentManifest = await manifestStore.read();
	const currentEntry = findManifestEntry(
		currentManifest,
		entityType,
		initialEntity.catalog_key,
	);
	const objectStorageKey = getObjectStorageKey(initialAsset.storage_key);
	const currentCanonicalStorageKey = currentEntry?.storageKey ?? currentEntry?.path;
	const canonicalCompatibilityPath = currentEntry?.path;

	if (
		currentEntry &&
		(currentEntry.path === initialAsset.storage_key ||
			(objectStorageKey && currentCanonicalStorageKey === objectStorageKey))
	) {
		return withTransaction(db, async (transaction) => {
			const entity = await findMediaEntityCatalogRecord(
				{ entityType, entityId },
				transaction,
			);
			const asset = await findMediaAssetById(mediaAssetId, transaction);
			if (!entity || entity.catalog_key !== initialEntity.catalog_key) {
				throw new MediaCanonicalPromotionError("entity_not_found", "entity");
			}
			if (!asset)
				throw new MediaCanonicalPromotionError("asset_not_found", "media asset");
			const assignment = await assignPrimaryMedia(
				{ mediaAssetId, entityType, entityId },
				transaction,
			);
			if (!assignment)
				throw new MediaCanonicalPromotionError("entity_not_found", "entity");
			return {
				status: "already_canonical",
				entity,
				asset,
				assignment,
				entry: currentEntry,
			};
		});
	}

	if (objectStorageKey && !canonicalCompatibilityPath) {
		throw new MediaCanonicalPromotionError(
			"canonical_path_missing",
			"An existing canonical compatibility path is required for object-backed promotion.",
		);
	}
	const source = assertMediaStorage(
		objectStorageKey ? dependencies.objectStorage : dependencies.sourceStorage,
	);
	const destination = objectStorageKey
		? null
		: assertMediaStorage(dependencies.canonicalStorage);
	const buffer = await readSourceAsset(source, initialAsset.storage_key);
	const mimeType = validateMimeType(initialAsset.mime_type);
	const extension = MIME_EXTENSIONS[mimeType];
	const digest = createHash("sha256").update(buffer).digest("hex").slice(0, 16);
	const filename = `${entityType}-${initialEntity.catalog_key}-${digest}`;
	const destinationKey = objectStorageKey
		? objectStorageKey
		: `${CANONICAL_STORAGE_PREFIX}/${filename}.${extension}`;
	/** @type {StoredMedia | null} */
	let stored = objectStorageKey ? { storageKey: objectStorageKey } : null;
	let ownsStoredFile = false;
	/** @type {ManifestChange | null} */
	let manifestChange = null;

	try {
		if (!objectStorageKey) {
			const localDestination = /** @type {MediaStorage} */ (destination);
			if (await localDestination.exists(destinationKey)) {
				const existingBytes = await localDestination.read(destinationKey);
				if (!existingBytes.equals(buffer)) {
					throw new MediaCanonicalPromotionError(
						"canonical_file_conflict",
						"The deterministic canonical media file already contains different data.",
					);
				}
				stored = { storageKey: destinationKey };
			} else {
				stored = await localDestination.put(buffer, { extension, filename });
				ownsStoredFile = true;
			}
		}

		if (!stored) throw new Error("Canonical media was not stored.");
		const canonicalPath = objectStorageKey
			? canonicalCompatibilityPath
			: stored.storageKey;
		if (!canonicalPath) throw new Error("Canonical media path is unavailable.");
		const entry = createCanonicalEntry({
			entityType,
			entityKey: initialEntity.catalog_key,
			path: canonicalPath,
			storageKey: objectStorageKey ?? undefined,
			mimeType,
			width: initialAsset.width,
			height: initialAsset.height,
			altTexts,
		});

		const result = await withTransaction(db, async (transaction) => {
			const entity = await findMediaEntityCatalogRecord(
				{ entityType, entityId },
				transaction,
			);
			const asset = await findMediaAssetById(mediaAssetId, transaction);
			if (!entity || entity.catalog_key !== initialEntity.catalog_key) {
				throw new MediaCanonicalPromotionError("entity_not_found", "entity");
			}
			if (!asset)
				throw new MediaCanonicalPromotionError("asset_not_found", "media asset");
			manifestChange = await manifestStore.update((manifest) => {
				const matchingEntry = findManifestEntry(
					manifest,
					entityType,
					entity.catalog_key,
				);
				if (
					matchingEntry &&
					(matchingEntry.path !== entry.path ||
						matchingEntry.storageKey !== entry.storageKey)
				) {
					return manifest.map((candidate) =>
						candidate.entityType === entityType &&
						candidate.entityKey === entity.catalog_key
							? entry
							: candidate,
					);
				}
				if (matchingEntry) return manifest;
				return [...manifest, entry];
			});
			const canonicalAsset = objectStorageKey
				? asset
				: await createMediaAsset(
						{
							storageKey: entry.storageKey ?? entry.path,
							mimeType: entry.mimeType,
							width: entry.width,
							height: entry.height,
							source: "curated",
						},
						transaction,
					);
			if (!canonicalAsset) {
				throw new MediaCanonicalPromotionError(
					"asset_create_failed",
					"The canonical media asset could not be created.",
				);
			}
			if (!objectStorageKey) {
				await replaceMediaAssetAltTexts(
					{ mediaAssetId: canonicalAsset.id, altTexts: entry.altTexts },
					transaction,
				);
			}
			const assignment = await assignPrimaryMedia(
				{ mediaAssetId: canonicalAsset.id, entityType, entityId },
				transaction,
			);
			if (!assignment)
				throw new MediaCanonicalPromotionError("entity_not_found", "entity");
			return { status: "promoted", entity, asset: canonicalAsset, assignment, entry };
		});
		return result;
	} catch (error) {
		const rollbackChange = /** @type {ManifestChange | null} */ (manifestChange);
		if (rollbackChange) {
			try {
				await manifestStore.write(rollbackChange.previous);
			} catch {
				throw new MediaCanonicalPromotionError(
					"manifest_rollback_failed",
					"Canonical media promotion failed and its durable manifest could not be restored.",
				);
			}
		}
		if (ownsStoredFile && stored && destination)
			await destination.delete(stored.storageKey).catch(() => {});
		throw error;
	}
}

/** @param {string} value @returns {MediaAssignableEntityType} */
function validateEntityType(value) {
	if (!SUPPORTED_ENTITY_TYPES.has(value)) {
		throw new MediaCanonicalPromotionError(
			"unsupported_entity_type",
			"Choose a supported catalog entity.",
		);
	}
	return /** @type {MediaAssignableEntityType} */ (value);
}

/** @param {unknown} value @param {string} label */
function validatePositiveInteger(value, label) {
	if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
		throw new MediaCanonicalPromotionError("invalid_id", `Choose a valid ${label}.`);
	}
	return value;
}

/** @param {Record<string, any>} asset @param {Partial<Record<"en" | "pt-BR", string>> | undefined} overrides */
function canonicalAltTexts(asset, overrides) {
	const values = {
		en: overrides?.en ?? asset.alt_texts?.en ?? asset.alt_text,
		"pt-BR": overrides?.["pt-BR"] ?? asset.alt_texts?.["pt-BR"],
	};
	if (
		typeof values.en !== "string" ||
		values.en.trim() === "" ||
		typeof values["pt-BR"] !== "string" ||
		values["pt-BR"].trim() === ""
	) {
		throw new MediaCanonicalPromotionError(
			"alt_text_missing",
			"Canonical media requires English and Brazilian Portuguese image descriptions.",
		);
	}
	return { en: values.en.trim(), "pt-BR": values["pt-BR"].trim() };
}

/** @param {string} storageKey @returns {Promise<Buffer>} */
async function readSourceAsset(storage, storageKey) {
	try {
		if (!(await storage.exists(storageKey))) {
			throw new MediaCanonicalPromotionError(
				"source_file_missing",
				"The selected media file is not available in configured storage.",
			);
		}
		return await storage.read(storageKey);
	} catch (error) {
		if (error instanceof MediaCanonicalPromotionError) throw error;
		throw new MediaCanonicalPromotionError(
			"source_file_unavailable",
			"The selected media file could not be read from configured storage.",
		);
	}
}

/** @param {string} mimeType */
function validateMimeType(mimeType) {
	if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
		throw new MediaCanonicalPromotionError(
			"unsupported_media_type",
			"The selected media type cannot become canonical.",
		);
	}
	return /** @type {keyof typeof MIME_EXTENSIONS} */ (mimeType);
}

/**
 * @param {{entityType: MediaAssignableEntityType, entityKey: string, path: string, storageKey?: string, mimeType: string, width: number, height: number, altTexts: {en: string, "pt-BR": string}}} input
 * @returns {CanonicalMediaManifestEntry}
 */
function createCanonicalEntry(input) {
	return {
		entityType: input.entityType,
		entityKey: input.entityKey,
		path: input.path,
		...(input.storageKey ? { storageKey: input.storageKey } : {}),
		role: "primary",
		mimeType: input.mimeType,
		width: input.width,
		height: input.height,
		source: "curated",
		alt: input.altTexts.en,
		altTexts: input.altTexts,
	};
}

/** @param {unknown} value @returns {string | null} */
function getObjectStorageKey(value) {
	if (typeof value !== "string" || !value.startsWith("assets/")) return null;
	return normalizeMediaObjectKey(value);
}

/** @param {ReadonlyArray<CanonicalMediaManifestEntry>} manifest @param {string} entityType @param {string} entityKey */
function findManifestEntry(manifest, entityType, entityKey) {
	return manifest.find(
		(entry) => entry.entityType === entityType && entry.entityKey === entityKey,
	);
}

/** @param {DatabasePool} db @param {(client: DatabaseClient) => Promise<any>} operation */
async function withTransaction(db, operation) {
	const client = await db.connect();
	try {
		await client.query("BEGIN");
		const result = await operation(client);
		await client.query("COMMIT");
		return result;
	} catch (error) {
		await client.query("ROLLBACK").catch(() => {});
		throw error;
	} finally {
		client.release();
	}
}
