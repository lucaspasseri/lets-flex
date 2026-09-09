import pool from "../../../db/pool.js";

/**
 * @typedef {import("./goals.types.js").GoalRow} GoalRow
 */

/**
 * @returns {Promise<GoalRow[]>}
 */

export async function findAll(db = pool) {
	const { rows } = await db.query("SELECT * FROM goals");
	return rows;
}

/** @param {{name: string}} input @param {any} db @returns {Promise<GoalRow | null>} */
export async function findByName({ name }, db = pool) {
	const { rows } = await db.query("SELECT * FROM goals WHERE name = $1", [name]);
	return rows[0] ?? null;
}
