import pool from "../../../db/pool.js";

export async function findAll(db = pool) {
	const { rows } = await db.query("SELECT * FROM step_types");

	return rows;
}
