import pool from "../pool.js";

async function getAllMuscles() {
	const { rows } = await pool.query("SELECT * FROM muscles");
	return rows;
}

export { getAllMuscles };
