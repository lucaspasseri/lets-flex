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
