import { createHash } from "node:crypto";

import pool from "../../../db/pool.js";
import {
	assignPrimaryMedia,
	createMediaAsset,
	findMediaAssetById,
	findMediaEntityCatalogRecord,
	findPrimaryMediaAssignment,
	replaceMediaAssetAltTexts,
} from "./mediaRepository.js";
import { createCanonicalMediaPath } from "./canonicalMediaPath.js";
import { normalizeMediaObjectKey } from "./storage/mediaObjectKey.js";
import { assertMediaStorage } from "./storage/storage.js";

/** @typedef {import("pg").Pool} DatabasePool */
/** @typedef {import("pg").PoolClient} DatabaseClient */
/** @typedef {import("./media.types.js").CanonicalMediaManifestEntry} CanonicalMediaManifestEntry */
/** @typedef {{storageKey: string}} StoredMedia */
/** @typedef {import("./storage/storage.js").MediaStorage} MediaStorage */
/** @typedef {import("./registry/canonicalMediaRegistry.js").CanonicalMediaRegistryStore} CanonicalMediaRegistry */
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
export class MediaCanonicalPromotionError extends Error {
	/** @param {string} code @param {string} message */
	constructor(code, message) {
		super(message);
		this.name = "MediaCanonicalPromotionError";
		this.code = code;
	}
}

/**
 * Promote a valid managed asset into the runtime canonical media state. The database assignment
 * stores the compatibility path, while an object-backed asset keeps its existing provider-neutral
 * object key. The source-controlled manifest remains seed/bootstrap data and is never modified.
 *
 * @param {{mediaAssetId: number, entityType: string, entityId: number, altTexts?: Partial<Record<"en" | "pt-BR", string>>}} input
 * @param {{db?: DatabasePool, objectStorage?: MediaStorage, sourceStorage?: MediaStorage, canonicalStorage?: MediaStorage, canonicalRegistry?: CanonicalMediaRegistry}} [dependencies]
 */
export async function promoteMediaToCanonical(input, dependencies = {}) {
	const entityType = validateEntityType(input.entityType);
	const entityId = validatePositiveInteger(input.entityId, "entity");
	const mediaAssetId = validatePositiveInteger(input.mediaAssetId, "media asset");
	const db = dependencies.db ?? pool;
	const canonicalRegistry = dependencies.canonicalRegistry;

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
	const initialAssignment = await findPrimaryMediaAssignment(
		{ entityType, entityId },
		db,
	);
	const objectStorageKey = getObjectStorageKey(initialAsset.storage_key);
	const currentCanonicalPath = initialAssignment?.canonical_path ?? null;
	const previousRegistry = canonicalRegistry
		? await readPreviousRegistryOverride(
				canonicalRegistry,
				entityType,
				initialEntity.catalog_key,
			)
		: null;
	if (canonicalRegistry && !objectStorageKey) {
		throw new MediaCanonicalPromotionError(
			"durable_media_object_required",
			"Canonical promotion requires an existing R2-backed media object.",
		);
	}
	if (canonicalRegistry && objectStorageKey && currentCanonicalPath)
		await ensureObjectAvailable(dependencies.objectStorage, objectStorageKey);

	if (currentCanonicalPath && initialAssignment?.media_asset_id === mediaAssetId) {
		/** @type {{entry: import("./registry/canonicalMediaRegistrySchema.js").CanonicalRegistryEntry, etag?: string} | null} */
		let registryWrite = null;
		try {
			return await withTransaction(db, async (transaction) => {
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
				const assignmentState = await findPrimaryMediaAssignment(
					{ entityType, entityId },
					transaction,
				);
				const assignment = await assignPrimaryMedia(
					{
						mediaAssetId,
						entityType,
						entityId,
						canonicalPath: assignmentState?.canonical_path ?? currentCanonicalPath,
					},
					transaction,
				);
				if (!assignment)
					throw new MediaCanonicalPromotionError("entity_not_found", "entity");
				if (canonicalRegistry) {
					registryWrite = await persistRegistryOverride(
						canonicalRegistry,
						createRegistryEntry({
							entityType,
							entityKey: entity.catalog_key,
							canonicalPath: assignment.canonical_path ?? currentCanonicalPath,
							objectKey: getObjectStorageKey(asset.storage_key),
							mimeType: asset.mime_type,
							width: asset.width,
							height: asset.height,
							altTexts,
						}),
						previousRegistry,
					);
				}
				return {
					status: "already_canonical",
					entity,
					asset,
					assignment,
					entry: createCanonicalEntry({
						entityType,
						entityKey: entity.catalog_key,
						path: assignmentState?.canonical_path ?? currentCanonicalPath,
						storageKey: getObjectStorageKey(asset.storage_key) ?? undefined,
						mimeType: asset.mime_type,
						width: asset.width,
						height: asset.height,
						altTexts,
					}),
				};
			});
		} catch (error) {
			await compensateRegistryWrite(canonicalRegistry, previousRegistry, registryWrite);
			throw error;
		}
	}

	const mimeType = validateMimeType(initialAsset.mime_type);
	const extension = MIME_EXTENSIONS[mimeType];
	const source = assertMediaStorage(
		objectStorageKey ? dependencies.objectStorage : dependencies.sourceStorage,
	);
	const destination = objectStorageKey
		? null
		: assertMediaStorage(dependencies.canonicalStorage);
	const buffer = await readSourceAsset(source, initialAsset.storage_key);
	const digest = createHash("sha256").update(buffer).digest("hex").slice(0, 16);
	const filename = `${entityType}-${initialEntity.catalog_key}-${digest}`;
	const destinationKey = objectStorageKey
		? objectStorageKey
		: createCanonicalMediaPath({
				entityType,
				entityKey: initialEntity.catalog_key,
				digest,
				extension,
			});
	const derivedCanonicalPath = createCanonicalMediaPath({
		entityType,
		entityKey: initialEntity.catalog_key,
		digest,
		extension,
	});
	/** @type {StoredMedia | null} */
	let stored = objectStorageKey ? { storageKey: objectStorageKey } : null;
	let ownsStoredFile = false;
	/** @type {{entry: import("./registry/canonicalMediaRegistrySchema.js").CanonicalRegistryEntry, etag?: string} | null} */
	let registryWrite = null;

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
		const storedMedia = stored;

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
			const assignmentState = await findPrimaryMediaAssignment(
				{ entityType, entityId },
				transaction,
			);
			const canonicalPath = objectStorageKey
				? (assignmentState?.canonical_path ??
					currentCanonicalPath ??
					derivedCanonicalPath)
				: storedMedia.storageKey;
			const entry = createCanonicalEntry({
				entityType,
				entityKey: entity.catalog_key,
				path: canonicalPath,
				storageKey: objectStorageKey ?? undefined,
				mimeType,
				width: asset.width,
				height: asset.height,
				altTexts,
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
				{
					mediaAssetId: canonicalAsset.id,
					entityType,
					entityId,
					canonicalPath,
				},
				transaction,
			);
			if (!assignment)
				throw new MediaCanonicalPromotionError("entity_not_found", "entity");
			if (canonicalRegistry) {
				registryWrite = await persistRegistryOverride(
					canonicalRegistry,
					createRegistryEntry({
						entityType,
						entityKey: entity.catalog_key,
						canonicalPath,
						objectKey: objectStorageKey,
						mimeType,
						width: asset.width,
						height: asset.height,
						altTexts: entry.altTexts,
					}),
					previousRegistry,
				);
			}
			return { status: "promoted", entity, asset: canonicalAsset, assignment, entry };
		});
		return result;
	} catch (error) {
		await compensateRegistryWrite(canonicalRegistry, previousRegistry, registryWrite);
		if (ownsStoredFile && stored && destination)
			await destination.delete(stored.storageKey).catch(() => {});
		throw error;
	}
}

/**
 * Read durable state before opening the database transaction. A missing registry is valid for
 * legacy direct service callers, but the application composition supplies this boundary for the
 * Admin flow; configured registry failures never permit a database-only success.
 *
 * @param {CanonicalMediaRegistry} registry
 * @param {string} entityType
 * @param {string} entityKey
 */
async function readPreviousRegistryOverride(registry, entityType, entityKey) {
	try {
		const result = await registry.getCanonicalOverride(entityType, entityKey);
		if (result && !result.etag)
			throw new Error("Existing canonical registry state has no concurrency token.");
		return result;
	} catch {
		throw new MediaCanonicalPromotionError(
			"registry_unavailable",
			"Canonical durability is unavailable; no database changes were made.",
		);
	}
}

/** @param {CanonicalMediaRegistry} registry @param {import("./registry/canonicalMediaRegistrySchema.js").CanonicalRegistryEntry} entry @param {{entry: import("./registry/canonicalMediaRegistrySchema.js").CanonicalRegistryEntry, etag?: string} | null} previous */
async function persistRegistryOverride(registry, entry, previous) {
	try {
		return await registry.putCanonicalOverride(entry, {
			expectedEtag: previous?.etag ?? null,
		});
	} catch (error) {
		const candidate = /** @type {{code?: unknown}} */ (error);
		if (candidate?.code === "write_conflict")
			throw new MediaCanonicalPromotionError(
				"registry_conflict",
				"Canonical media changed concurrently; no promotion was committed.",
			);
		throw new MediaCanonicalPromotionError(
			"registry_unavailable",
			"Canonical durability failed; no promotion was committed.",
		);
	}
}

/** @param {CanonicalMediaRegistry | undefined} registry @param {{entry: import("./registry/canonicalMediaRegistrySchema.js").CanonicalRegistryEntry, etag?: string} | null} previous @param {{entry: import("./registry/canonicalMediaRegistrySchema.js").CanonicalRegistryEntry, etag?: string} | null} written */
async function compensateRegistryWrite(registry, previous, written) {
	if (!registry || !written) return;
	try {
		if (previous) {
			if (!written.etag) throw new Error("Missing registry concurrency token.");
			await registry.putCanonicalOverride(previous.entry, {
				expectedEtag: written.etag,
			});
		} else {
			if (!written.etag) throw new Error("Missing registry concurrency token.");
			await registry.deleteCanonicalOverride(
				written.entry.entityType,
				written.entry.entityKey,
				{ expectedEtag: written.etag },
			);
		}
	} catch {
		throw new MediaCanonicalPromotionError(
			"registry_reconciliation_required",
			"Canonical promotion failed and durable state requires reconciliation.",
		);
	}
}

/**
 * @param {{entityType: MediaAssignableEntityType, entityKey: string, canonicalPath: string, objectKey: string | null, mimeType: string, width: number, height: number, altTexts: {en: string, "pt-BR": string}}} input
 * @returns {import("./registry/canonicalMediaRegistrySchema.js").CanonicalRegistryEntry}
 */
function createRegistryEntry(input) {
	if (!input.objectKey)
		throw new MediaCanonicalPromotionError(
			"durable_media_object_required",
			"Canonical promotion requires an existing R2-backed media object.",
		);
	return {
		schemaVersion: 1,
		entityType: input.entityType,
		entityKey: input.entityKey,
		role: "canonical",
		asset: {
			objectKey: input.objectKey,
			mimeType: input.mimeType,
			width: input.width,
			height: input.height,
		},
		canonicalPath: input.canonicalPath,
		alt: input.altTexts,
		updatedAt: new Date().toISOString(),
	};
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

/** @param {MediaStorage | undefined} storage @param {string} storageKey */
async function ensureObjectAvailable(storage, storageKey) {
	try {
		if (!(await assertMediaStorage(storage).exists(storageKey)))
			throw new MediaCanonicalPromotionError(
				"source_file_missing",
				"The selected media file is not available in configured storage.",
			);
	} catch (error) {
		if (error instanceof MediaCanonicalPromotionError) throw error;
		throw new MediaCanonicalPromotionError(
			"source_file_unavailable",
			"The selected media file could not be verified in configured storage.",
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
