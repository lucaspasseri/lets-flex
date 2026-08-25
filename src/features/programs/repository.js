import pool from "../../../db/pool.js";

/**
 * @typedef {import("./programs.types.js").ProgramRow} ProgramRow
 * @typedef {import("../users/users.types.js").UserRow} UserRow
 * @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient
 */

/**
 * @typedef {object} findByIdInput
 * @property {ProgramRow["id"]} programId
 */

/**
 * @typedef {object} findAllByUserId
 * @property {UserRow["id"]} userId
 */

/**
 * @param {findByIdInput} input
 * @param {DatabaseClient} [db]
 * @returns {Promise<ProgramRow | null>}
 */

export async function findById({ programId }, db = pool) {
	const { rows } = await db.query("SELECT * FROM programs WHERE id = $1", [programId]);

	return rows[0] ?? null;
}

/**
 * @param {findAllByUserId} input
 * @returns {Promise<ProgramRow[]>}
 */

export async function findAllByUserId({ userId }, db = pool) {
	const { rows } = await db.query("SELECT * FROM programs WHERE user_id = $1", [
		userId,
	]);

	return rows;
}

export async function create({ name, userId, goalId, startDate }, db = pool) {
	if (startDate === "") {
		const { rows } = await db.query(
			"INSERT INTO programs (name, user_id, goal_id) VALUES ($1, $2, $3) RETURNING id",
			[name, userId, goalId],
		);

		return rows[0] ?? null;
	}

	const { rows } = await db.query(
		"INSERT INTO programs (name, user_id, goal_id, start_date) VALUES ($1, $2, $3, $4) RETURNING id",
		[name, userId, goalId, startDate],
	);
	return rows[0] ?? null;
}

/** Deletes only a program owned by the active user. Cascading foreign keys remove its hierarchy. */
export async function deleteByIdForUser({ programId, userId }, db = pool) {
	const { rows } = await db.query(
		"DELETE FROM programs WHERE id = $1 AND user_id = $2 RETURNING *",
		[programId, userId],
	);
	return rows[0] ?? null;
}
