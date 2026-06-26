import pool from "../pool.js";

async function getAllStepTypes(db) {
	const { rows: stepTypes } = await db.query("SELECT * FROM step_types");

	return stepTypes;
}

async function postNewStepType(name) {
	await pool.query("INSERT INTO step_types (name) VALUES ($1)", [name]);
}

async function deleteStepTypeByName(name) {
	await pool.query("DELETE FROM step_types WHERE name = $1", [name]);
}

export { getAllStepTypes, postNewStepType, deleteStepTypeByName };
