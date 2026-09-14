import pool from "../../../db/pool.js";
import {
	assignPrimaryMedia,
	createMediaAsset,
	replaceMediaAssetAltTexts,
} from "./mediaRepository.js";
import { normalizeMediaAltTexts } from "./manageMedia.js";
import { inspectUploadedImage } from "./mediaUpload.js";
import { createPrivateMediaCandidateStorage } from "./mediaCandidateStorage.js";
import { findPendingMediaGenerationCandidate } from "./mediaGenerationCandidates.js";
import { assertMediaStorage, compensateMediaStorageWrite } from "./storage/storage.js";

/** @typedef {import("pg").Pool} DatabasePool */
/** @typedef {import("pg").PoolClient} DatabaseClient */
/** @typedef {import("./storage/storage.js").MediaStorage} MediaStorage */

export class MediaGenerationApprovalError extends Error {
	constructor(code, message) {
		super(message);
		this.name = "MediaGenerationApprovalError";
		this.code = code;
	}
}

/** @param {Record<string, unknown>} altTexts */
function requireMeaningfulLocalizedAltTexts(altTexts) {
	const normalized = normalizeMediaAltTexts(altTexts);
	if (!normalized.en || !normalized["pt-BR"])
		throw new MediaGenerationApprovalError(
			"missing_alt_text",
			"Provide meaningful English and Brazilian Portuguese image descriptions before approval.",
		);
	return normalized;
}

/** @param {number} candidateId @param {DatabaseClient} db */
async function lockPendingCandidate(candidateId, db) {
	const { rows } = await db.query(
		`SELECT id, entity_type, entity_id, status, storage_key, mime_type, width, height
		FROM media_generation_candidates
		WHERE id = $1 AND status = 'pending_review'
		FOR UPDATE`,
		[candidateId],
	);
	return rows[0] ?? null;
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

/**
 * Promote one reviewed private candidate through the same persistent asset and assignment
 * boundaries used by manual uploads. The previous primary assignment is only replaced in the
 * transaction after the new public asset and localized descriptions exist.
 *
 * @param {{candidateId: number, entityType: string, entityId: number, reviewerUserId: number, altTexts: Record<string, unknown>}} input
 * @param {{db?: DatabasePool, privateStorage?: ReturnType<typeof createPrivateMediaCandidateStorage>, publicStorage?: MediaStorage}} [dependencies]
 */
export async function approveMediaGenerationCandidate(input, dependencies = {}) {
	if (!Number.isInteger(input.reviewerUserId) || input.reviewerUserId <= 0)
		throw new MediaGenerationApprovalError(
			"invalid_reviewer",
			"Image approval is unavailable.",
		);
	const altTexts = requireMeaningfulLocalizedAltTexts(input.altTexts);
	const db = dependencies.db ?? pool;
	const privateStorage =
		dependencies.privateStorage ?? createPrivateMediaCandidateStorage();
	const publicStorage = assertMediaStorage(dependencies.publicStorage);
	const candidate = await findPendingMediaGenerationCandidate(input.candidateId, db);
	if (
		!candidate ||
		candidate.entity_type !== input.entityType ||
		candidate.entity_id !== input.entityId
	) {
		throw new MediaGenerationApprovalError(
			"candidate_not_found",
			"Generated media candidate was not found.",
		);
	}

	let inspected;
	try {
		inspected = inspectUploadedImage({
			buffer: await privateStorage.read(candidate.storage_key),
			mimetype: candidate.mime_type,
			originalname: candidate.storage_key,
		});
	} catch (_error) {
		throw new MediaGenerationApprovalError(
			"candidate_file_unavailable",
			"The private candidate file is unavailable. Generate a replacement candidate.",
		);
	}

	const stored = await publicStorage.put(inspected.buffer, {
		extension: inspected.extension,
	});
	let approval;
	try {
		approval = await withTransaction(db, async (client) => {
			const locked = await lockPendingCandidate(input.candidateId, client);
			if (
				!locked ||
				locked.entity_type !== input.entityType ||
				locked.entity_id !== input.entityId
			) {
				throw new MediaGenerationApprovalError(
					"candidate_not_found",
					"Generated media candidate was not found.",
				);
			}
			const asset = await createMediaAsset(
				{
					storageKey: stored.storageKey,
					mimeType: inspected.mimeType,
					width: inspected.width,
					height: inspected.height,
					source: "ai-generation",
				},
				client,
			);
			if (!asset)
				throw new MediaGenerationApprovalError(
					"asset_not_created",
					"Generated media could not be approved.",
				);
			await replaceMediaAssetAltTexts({ mediaAssetId: asset.id, altTexts }, client);
			const assignment = await assignPrimaryMedia(
				{
					mediaAssetId: asset.id,
					entityType: /** @type {any} */ (input.entityType),
					entityId: input.entityId,
				},
				client,
			);
			if (!assignment)
				throw new MediaGenerationApprovalError(
					"entity_not_found",
					"The catalog entity is no longer available.",
				);
			const { rows } = await client.query(
				`UPDATE media_generation_candidates
				SET status = 'approved', reviewed_by_user_id = $2, reviewed_at = NOW(),
					approved_media_asset_id = $3
				WHERE id = $1 AND status = 'pending_review'
				RETURNING id, entity_type, entity_id, status, approved_media_asset_id`,
				[input.candidateId, input.reviewerUserId, asset.id],
			);
			if (!rows[0])
				throw new MediaGenerationApprovalError(
					"candidate_not_found",
					"Generated media candidate was not found.",
				);
			return { candidate: rows[0], asset, assignment };
		});
	} catch (error) {
		return compensateMediaStorageWrite(publicStorage, stored.storageKey, error);
	}

	let privateCleanupPending = false;
	try {
		await privateStorage.remove(candidate.storage_key);
		await db.query(
			`UPDATE media_generation_candidates
			SET private_file_removed_at = NOW()
			WHERE id = $1 AND status = 'approved'`,
			[input.candidateId],
		);
	} catch (_error) {
		privateCleanupPending = true;
	}
	return { ...approval, privateCleanupPending };
}
