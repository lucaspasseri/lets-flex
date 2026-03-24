import pool from "../pool.js";

async function getAllUsers() {
	const { rows: users } = await pool.query("SELECT * FROM users");

	return users;
}

async function postNewUser(name, dob, anamnesis) {
	await pool.query(
		"INSERT INTO users (name, date_of_birth, anamnesis) VALUES ($1, $2, $3)",
		[name, dob, anamnesis],
	);
}

// async function postNewGoal(name) {
// 	await pool.query("INSERT INTO goals (name) VALUES ($1)", [name]);
// }

// async function deleteGoalByName(name) {
// 	await pool.query("DELETE FROM goals WHERE name = $1", [name]);
// }

export { getAllUsers, postNewUser };
