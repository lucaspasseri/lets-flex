import pool from "../../../db/pool.js";
import {
	MEDIA_LOCALES,
	assignPrimaryMedia,
	createMediaAsset,
	findMediaAssetById,
	mediaEntityExists,
	removePrimaryMedia,
	replaceMediaAssetAltTexts,
} from "./mediaRepository.js";
import { MediaUploadValidationError, inspectUploadedImage } from "./mediaUpload.js";
import { assertMediaStorage, compensateMediaStorageWrite } from "./storage/storage.js";

/** @typedef {import("pg").Pool} DatabasePool */
/** @typedef {import("pg").PoolClient} DatabaseClient */
/** @typedef {import("./storage/storage.js").MediaStorage} MediaStorage */
/** @typedef {"exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern"} MediaAssignableEntityType */

const MAX_ALT_TEXT_LENGTH = 500;
const SUPPORTED_ENTITY_TYPES = new Set([
	"exercise",
	"exercise_variant",
	"muscle",
	"equipment",
	"movement_pattern",
]);

export class MediaManagementValidationError extends Error {
	/** @param {string} code @param {string} message */
	constructor(code, message) {
		super(message);
		this.name = "MediaManagementValidationError";
		this.code = code;
	}
}

export class MediaManagementNotFoundError extends Error {
	/** @param {string} subject */
	constructor(subject) {
		super(`Media ${subject} was not found.`);
		this.name = "MediaManagementNotFoundError";
		this.subject = subject;
	}
}

/**
 * Validate and normalize the localized labels shared by all management operations.
 * Empty values mean that the locale should use the resolver's fallback.
 *
 * @param {unknown} input
 * @returns {Partial<Record<"en" | "pt-BR", string>>}
 */
export function normalizeMediaAltTexts(input = {}) {
	if (!input || typeof input !== "object" || Array.isArray(input)) {
		throw new MediaManagementValidationError(
			"invalid_alt_texts",
			"Provide valid localized image descriptions.",
		);
	}
	const values = /** @type {Record<string, unknown>} */ (input);
	const result = {};
	for (const locale of MEDIA_LOCALES) {
		const value = values[locale];
		if (value == null || value === "") continue;
		if (typeof value !== "string" || value.trim().length > MAX_ALT_TEXT_LENGTH) {
			throw new MediaManagementValidationError(
				"invalid_alt_text",
				"Image descriptions must be 500 characters or fewer.",
			);
		}
		if (value.trim() !== "") result[locale] = value.trim();
	}
	return result;
}

/**
 * @param {unknown} entityType
 * @param {unknown} entityId
 * @returns {MediaAssignableEntityType}
 */
function validateEntityIdentity(entityType, entityId) {
	if (typeof entityType !== "string" || !SUPPORTED_ENTITY_TYPES.has(entityType)) {
		throw new MediaManagementValidationError(
			"unsupported_entity_type",
			"Choose a supported catalog entity.",
		);
	}
	if (typeof entityId !== "number" || !Number.isInteger(entityId) || entityId <= 0) {
		throw new MediaManagementValidationError(
			"invalid_entity_id",
			"Choose a valid catalog entity.",
		);
	}
	return /** @type {MediaAssignableEntityType} */ (entityType);
}

/** @param {unknown} mediaAssetId */
function validateMediaAssetId(mediaAssetId) {
	if (
		typeof mediaAssetId !== "number" ||
		!Number.isInteger(mediaAssetId) ||
		mediaAssetId <= 0
	) {
		throw new MediaManagementValidationError(
			"invalid_media_asset_id",
			"Choose a valid media asset.",
		);
	}
}

/**
 * Create an uploaded asset and assign it as the entity's primary media. The file is written before
 * the transaction and removed if any database write fails, so a failed request does not commit an
 * assignment or intentionally leave a storage object behind.
 *
 * @param {{entityType: string, entityId: number, file: Record<string, any>, altTexts?: unknown}} input
 * @param {{db?: DatabasePool, storage?: MediaStorage}} [dependencies]
 */
export async function createAndAssignUploadedMedia(input, dependencies = {}) {
	const entityType = validateEntityIdentity(input.entityType, input.entityId);
	const altTexts = normalizeMediaAltTexts(input.altTexts);
	let inspected;
	try {
		inspected = inspectUploadedImage(input.file);
	} catch (error) {
		if (error instanceof MediaUploadValidationError) throw error;
		throw new MediaUploadValidationError(
			"invalid_image",
			"The uploaded file is invalid.",
		);
	}

	const storage = assertMediaStorage(dependencies.storage);
	const stored = await storage.put(inspected.buffer, {
		extension: inspected.extension,
	});
	try {
		return await withTransaction(dependencies.db ?? pool, async (db) => {
			const asset = await createMediaAsset(
				{
					storageKey: stored.storageKey,
					mimeType: inspected.mimeType,
					width: inspected.width,
					height: inspected.height,
					source: "admin-upload",
				},
				db,
			);
			if (!asset) throw new Error("Uploaded media asset could not be created.");
			await replaceMediaAssetAltTexts({ mediaAssetId: asset.id, altTexts }, db);
			const assignment = await assignPrimaryMedia(
				{
					mediaAssetId: asset.id,
					entityType,
					entityId: input.entityId,
				},
				db,
			);
			if (!assignment) throw new MediaManagementNotFoundError("entity");
			return { asset, assignment };
		});
	} catch (error) {
		return compensateMediaStorageWrite(storage, stored.storageKey, error);
	}
}

/**
 * Assign an existing reusable asset, optionally replacing its localized labels atomically.
 *
 * @param {{mediaAssetId: number, entityType: string, entityId: number, altTexts?: unknown}} input
 * @param {{db?: DatabasePool}} [dependencies]
 */
export async function assignExistingMedia(input, dependencies = {}) {
	const entityType = validateEntityIdentity(input.entityType, input.entityId);
	validateMediaAssetId(input.mediaAssetId);
	const altTexts =
		input.altTexts === undefined ? null : normalizeMediaAltTexts(input.altTexts);
	return withTransaction(dependencies.db ?? pool, async (db) => {
		const asset = await findMediaAssetById(input.mediaAssetId, db);
		if (!asset) throw new MediaManagementNotFoundError("asset");
		const assignment = await assignPrimaryMedia(
			{
				mediaAssetId: input.mediaAssetId,
				entityType,
				entityId: input.entityId,
			},
			db,
		);
		if (!assignment) throw new MediaManagementNotFoundError("entity");
		if (altTexts) {
			await replaceMediaAssetAltTexts(
				{ mediaAssetId: input.mediaAssetId, altTexts },
				db,
			);
		}
		return { asset, assignment };
	});
}

/**
 * Remove only the entity assignment. The reusable media asset remains available to other entities.
 *
 * @param {{entityType: string, entityId: number}} input
 * @param {{db?: DatabasePool}} [dependencies]
 */
export async function removeAssignedMedia(input, dependencies = {}) {
	const entityType = validateEntityIdentity(input.entityType, input.entityId);
	return withTransaction(dependencies.db ?? pool, async (db) => {
		if (!(await mediaEntityExists({ entityType, entityId: input.entityId }, db)))
			throw new MediaManagementNotFoundError("entity");
		await removePrimaryMedia({ entityType, entityId: input.entityId }, db);
		return { entityType, entityId: input.entityId };
	});
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
