import pool from "../pool.js";

async function getAllPrograms() {
	const { rows: programs } = await pool.query("SELECT * FROM programs");

	return programs;
}

async function getAllProgramsWithoutIds() {
	const { rows: programs } = await pool.query(
		"SELECT programs.id, programs.name, users.name AS user_name, goals.name AS goal_name, date_of_birth, anamnesis FROM programs JOIN users ON programs.user_id = users.id JOIN goals ON programs.goal_id = goals.id",
	);

	return programs;
}

async function postNewProgram(name, userId, goalId) {
	await pool.query(
		"INSERT INTO programs (name, user_id, goal_id) VALUES ($1, $2, $3)",
		[name, userId, goalId],
	);
}

export { getAllPrograms, postNewProgram, getAllProgramsWithoutIds };
