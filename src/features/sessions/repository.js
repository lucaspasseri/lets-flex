import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

/**
 * @typedef {import("./sessions.types.js").CreateSessionInput} CreateSessionInput
 * @typedef {import("./sessions.types.js").FindByIdInput} FindByIdInput
 * @typedef {import("./sessions.types.js").SessionRow} SessionRow
 */

/** @param {{userId: number | null}} input @param {any} db */
export async function findVisibleForUser({ userId }, db = pool) {
	const { rows } = await db.query(
		queries
			.findAllQuery()
			.replace(
				"ORDER BY se.id;",
				"WHERE se.is_archived = FALSE AND (se.owner_user_id IS NULL OR se.owner_user_id = $1) ORDER BY se.id;",
			),
		[userId],
	);
	return rows;
}

/**
 * @param {CreateSessionInput} input
 * @param {import("pg").Pool | import("pg").PoolClient} [db]
 * @returns {Promise<SessionRow | null>}
 */

export async function create({ name, notes, ownerUserId }, db = pool) {
	const { rows } = await db.query(
		"INSERT INTO sessions (name, notes, owner_user_id) VALUES ($1, $2, $3) RETURNING id",
		[name, notes, ownerUserId],
	);

	return rows[0] ?? null;
}

/**
 *
 * @param {*} param0
 * @param {*} db
 */

export async function archive({ sessionId, ownerUserId }, db = pool) {
	const { rowCount } = await db.query(
		`
			UPDATE sessions
			SET is_archived = TRUE
			WHERE id = $1 AND owner_user_id = $2 AND is_archived = FALSE;
		`,
		[sessionId, ownerUserId],
	);
	return rowCount > 0;
}

/** @param {{sessionId: number, name: string, notes: string | null, ownerUserId: number}} input @param {any} db */
export async function update({ sessionId, name, notes, ownerUserId }, db = pool) {
	const { rowCount } = await db.query(
		"UPDATE sessions SET name = $2, notes = $3, updated_at = NOW() WHERE id = $1 AND owner_user_id = $4",
		[sessionId, name, notes, ownerUserId],
	);
	return rowCount > 0;
}
