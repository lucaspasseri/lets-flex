import pool from "../pool.js";

async function getAllGoals() {
	const { rows: goals } = await pool.query("SELECT * FROM goals");

	return goals;
}

async function postNewGoal(name) {
	await pool.query("INSERT INTO goals (name) VALUES ($1)", [name]);
}

async function deleteGoalByName(name) {
	await pool.query("DELETE FROM goals WHERE name = $1", [name]);
}

export { getAllGoals, postNewGoal, deleteGoalByName };
