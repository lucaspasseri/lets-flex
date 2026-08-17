import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

/**
 * @typedef {import("./sessions.types.js").CreateSessionInput} CreateSessionInput
 * @typedef {import("./sessions.types.js").FindByIdInput} FindByIdInput
 * @typedef {import("./sessions.types.js").SessionRow} SessionRow
 */

export async function findAll(db = pool) {
	const { rows } = await db.query(queries.findAllQuery());
	return rows;
}

/**
 * @param {CreateSessionInput} input
 * @returns {Promise<SessionRow>}
 */

export async function create({ name, notes }, db = pool) {
	const { rows } = await db.query(
		"INSERT INTO sessions (name, notes) VALUES ($1, $2) RETURNING id",
		[name, notes],
	);

	return rows[0] ?? null;
}

/**
 *
 * @param {*} param0
 * @param {*} db
 */

export async function archive({ sessionId }, db = pool) {
	await db.query(
		`
			UPDATE sessions
			SET is_archived = TRUE
			WHERE id = $1;
		`,
		[sessionId],
	);
}

/**
 *
 * @param {FindByIdInput} input
 * @returns {Promise<SessionRow>}
 */

export async function findById({ sessionId }, db = pool) {
	const { rows } = await db.query("SELECT * FROM sessions WHERE id = $1", [
		sessionId,
	]);

	return rows[0] ?? null;
}
