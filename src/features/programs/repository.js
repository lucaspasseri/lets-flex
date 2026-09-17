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

/** @param {{programId: number, userId: number}} input @param {DatabaseClient} [db] */
export async function findByIdForUser({ programId, userId }, db = pool) {
	const { rows } = await db.query(
		"SELECT * FROM programs WHERE id = $1 AND user_id = $2",
		[programId, userId],
	);
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

/**
 * Finds the complete owner-specific starter hierarchy by its stable
 * provisioning key. The key is scoped to the owner, not to display names.
 * @param {{userId: number, provisioningKey: string}} input
 * @param {import("pg").Pool | import("pg").PoolClient} [db]
 */
export async function findStarterWorkspace({ userId, provisioningKey }, db = pool) {
	const { rows } = await db.query(
		`SELECT p.id AS program_id, c.id AS cycle_id,
		        td.id AS training_day_id, ws.id AS workout_session_id,
		        s.id AS session_id
		 FROM programs AS p
		 JOIN cycles AS c ON c.program_id = p.id
		 JOIN training_days AS td ON td.cycle_id = c.id
		 JOIN workout_sessions AS ws ON ws.training_day_id = td.id
		 JOIN sessions AS s ON s.id = ws.session_id
		 WHERE p.user_id = $1 AND p.provisioning_key = $2
		   AND s.owner_user_id = p.user_id
		 ORDER BY c.cycle_order, td.day_order, ws.workout_session_order
		 LIMIT 1`,
		[userId, provisioningKey],
	);
	return rows[0] ?? null;
}

/**
 * @param {{name: string, userId: number, goalId: number, startDate?: string, provisioningKey?: string | null}} input
 * @param {import("pg").Pool | import("pg").PoolClient} [db]
 */
export async function create(
	{ name, userId, goalId, startDate, provisioningKey = null },
	db = pool,
) {
	if (startDate === "") {
		const { rows } = await db.query(
			"INSERT INTO programs (name, user_id, goal_id, provisioning_key) VALUES ($1, $2, $3, $4) RETURNING id",
			[name, userId, goalId, provisioningKey],
		);

		return rows[0] ?? null;
	}

	const { rows } = await db.query(
		"INSERT INTO programs (name, user_id, goal_id, start_date, provisioning_key) VALUES ($1, $2, $3, $4, $5) RETURNING id",
		[name, userId, goalId, startDate, provisioningKey],
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
