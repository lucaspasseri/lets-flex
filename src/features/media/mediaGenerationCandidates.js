import pool from "../../../db/pool.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */
/** @typedef {import("pg").Pool} DatabasePool */

/**
 * Candidate rows are deliberately separate from media assets. They are only loaded by the
 * admin workflow and therefore can never participate in normal media resolution.
 *
 * @param {{entityType: string, entityId: number}} input
 * @param {DatabaseClient} [db]
 */
export async function findLatestPendingMediaGenerationCandidate(
	{ entityType, entityId },
	db = pool,
) {
	try {
		const { rows } = await db.query(
			`SELECT id, entity_type, entity_id, status, provider, provider_model, preset,
				prompt_version, storage_key, mime_type, width, height, created_at
			FROM media_generation_candidates
			WHERE entity_type = $1 AND entity_id = $2 AND status = 'pending_review'
			ORDER BY created_at DESC, id DESC
			LIMIT 1`,
			[entityType, entityId],
		);
		return rows[0] ?? null;
	} catch (error) {
		// A development database may not yet have been reset to the current authoritative
		// schema. Keep existing media management usable until its normal reset is performed.
		if (/** @type {any} */ (error)?.code === "42P01") return null;
		throw error;
	}
}

/** @param {number} candidateId @param {DatabaseClient} [db] */
export async function findPendingMediaGenerationCandidate(candidateId, db = pool) {
	const { rows } = await db.query(
		`SELECT id, entity_type, entity_id, status, storage_key, mime_type, width, height
		FROM media_generation_candidates
		WHERE id = $1 AND status = 'pending_review'`,
		[candidateId],
	);
	return rows[0] ?? null;
}

/**
 * Record the rejection before attempting private-file cleanup. A failed cleanup never restores
 * a pending candidate or exposes it publicly; the absent removal timestamp identifies it for a
 * safe retry.
 *
 * @param {{candidateId: number, entityType: string, entityId: number, reviewerUserId: number, storage: {remove(storageKey: string): Promise<void>}}} input
 * @param {DatabasePool} [db]
 */
export async function rejectMediaGenerationCandidate(
	{ candidateId, entityType, entityId, reviewerUserId, storage },
	db = pool,
) {
	if (!Number.isInteger(reviewerUserId) || reviewerUserId <= 0)
		throw new Error("A valid reviewer is required.");
	const client = await db.connect();
	let candidate;
	try {
		await client.query("BEGIN");
		const { rows } = await client.query(
			`SELECT id, entity_type, entity_id, storage_key
			FROM media_generation_candidates
			WHERE id = $1 AND status = 'pending_review'
			FOR UPDATE`,
			[candidateId],
		);
		candidate = rows[0] ?? null;
		if (
			!candidate ||
			candidate.entity_type !== entityType ||
			candidate.entity_id !== entityId
		) {
			await client.query("ROLLBACK");
			return null;
		}
		const result = await client.query(
			`UPDATE media_generation_candidates
			SET status = 'rejected', reviewed_by_user_id = $2, reviewed_at = NOW()
			WHERE id = $1 AND status = 'pending_review'
			RETURNING id, entity_type, entity_id, status, reviewed_at`,
			[candidateId, reviewerUserId],
		);
		await client.query("COMMIT");
		if (!result.rows[0]) return null;
		let privateCleanupPending = false;
		try {
			await storage.remove(candidate.storage_key);
			await db.query(
				`UPDATE media_generation_candidates
				SET private_file_removed_at = NOW()
				WHERE id = $1 AND status = 'rejected'`,
				[candidateId],
			);
		} catch (_error) {
			privateCleanupPending = true;
		}
		return { ...result.rows[0], privateCleanupPending };
	} catch (error) {
		await client.query("ROLLBACK").catch(() => {});
		throw error;
	} finally {
		client.release();
	}
}
