import pool from "../../../db/pool.js";
import { normalizeCatalogLocale } from "../catalogLocalization/catalogLocalization.js";
import * as queries from "./queries.js";

/**
 * @typedef {import("./sessions.types.js").CreateSessionInput} CreateSessionInput
 * @typedef {import("./sessions.types.js").FindByIdInput} FindByIdInput
 * @typedef {import("./sessions.types.js").SessionRow} SessionRow
 */

/** @param {{userId: number | null, locale?: string}} input @param {any} db */
export async function findVisibleForUser({ userId, locale }, db = pool) {
	const { rows } = await db.query(
		queries.findAllQuery().replace(
			"ORDER BY se.id;",
			`WHERE se.is_archived = FALSE
					AND (
						se.owner_user_id = $1
						OR (
							se.owner_user_id IS NULL
							AND NOT EXISTS (
								SELECT 1
								FROM sessions AS owned_session
								WHERE owned_session.owner_user_id = $1
								  AND owned_session.name = se.name
							)
						)
					)
					ORDER BY se.id;`,
		),
		[userId, normalizeCatalogLocale(locale)],
	);
	return rows;
}

/** @param {{name: string}} input @param {any} db */
export async function findActiveGlobalByName({ name }, db = pool) {
	const { rows } = await db.query(
		`SELECT id, name, notes, is_archived, owner_user_id
		 FROM sessions
		 WHERE name = $1 AND owner_user_id IS NULL AND is_archived = FALSE`,
		[name],
	);
	return rows[0] ?? null;
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
 * Creates a private copy of an active global session template for one user.
 * The caller owns the surrounding transaction so the session and its steps are atomic.
 * @param {{sourceSessionId: number, ownerUserId: number}} input
 * @param {any} db
 * @returns {Promise<{id: number, name: string} | null>}
 */
export async function createOwnedCopy({ sourceSessionId, ownerUserId }, db = pool) {
	const { rows } = await db.query(
		`INSERT INTO sessions (owner_user_id, name, notes)
		 SELECT $2, name, notes
		 FROM sessions
		 WHERE id = $1 AND owner_user_id IS NULL AND is_archived = FALSE
		 RETURNING id, name`,
		[sourceSessionId, ownerUserId],
	);
	const copy = rows[0] ?? null;
	if (!copy) return null;

	await db.query(
		`INSERT INTO session_steps
			(session_id, step_type_id, exercise_variant_id, name, sets, reps, load_value, load_unit, step_order)
		 SELECT $1, step_type_id, exercise_variant_id, name, sets, reps, load_value, load_unit, step_order
		 FROM session_steps
		 WHERE session_id = $2`,
		[copy.id, sourceSessionId],
	);

	return copy;
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

/**
 * Archives an owned Library session so workout references and historical snapshots remain valid.
 * @param {{sessionId: number, ownerUserId: number}} input
 * @param {any} db
 * @returns {Promise<"archived" | null>}
 */
export async function deleteOrArchive({ sessionId, ownerUserId }, db = pool) {
	const archived = await db.query(
		`UPDATE sessions
		 SET is_archived = TRUE, updated_at = NOW()
		 WHERE id = $1 AND owner_user_id = $2 AND is_archived = FALSE
		 RETURNING id`,
		[sessionId, ownerUserId],
	);
	return archived.rowCount > 0 ? "archived" : null;
}

/** @param {{sessionId: number, name: string, notes: string | null, ownerUserId: number}} input @param {any} db */
export async function update({ sessionId, name, notes, ownerUserId }, db = pool) {
	const { rowCount } = await db.query(
		"UPDATE sessions SET name = $2, notes = $3, updated_at = NOW() WHERE id = $1 AND owner_user_id = $4",
		[sessionId, name, notes, ownerUserId],
	);
	return rowCount > 0;
}
