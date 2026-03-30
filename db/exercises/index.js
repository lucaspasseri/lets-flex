import pool from "../pool.js";

async function getAllExercises() {
	const { rows } = await pool.query("SELECT * FROM exercises");
	return rows;
}

async function postNewExercise(name, movementPatternId) {
	await pool.query(
		"INSERT INTO exercises (name, movement_pattern_id) VALUES ($1, $2) RETURNING *",
		[name, movementPatternId],
	);
}

export { getAllExercises, postNewExercise };
