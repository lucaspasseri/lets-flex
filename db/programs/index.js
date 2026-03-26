import pool from "../pool.js";

async function getAllPrograms() {
	const { rows: programs } = await pool.query("SELECT * FROM programs");

	return programs;
}

async function postNewProgram(name, userId, goalId) {
	await pool.query(
		"INSERT INTO programs (name, user_id, goal_id) VALUES ($1, $2, $3)",
		[name, userId, goalId],
	);
}

export { getAllPrograms, postNewProgram };
