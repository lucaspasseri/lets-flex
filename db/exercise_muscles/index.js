import pool from "../pool.js";

async function postNewExerciseMuscle(exerciseId, muscleId, role) {
	await pool.query(
		"INSERT INTO exercise_muscles (exercise_id, muscle_id, role) VALUES ($1, $2, $3)",
		[Number(exerciseId), Number(muscleId), role],
	);
}

async function getAllExerciseMusclesWithJoins() {
	const { rows } = await pool.query(`
		SELECT e.name AS exercise_name, em.role, m.common_name AS muscle_common_name, m.scientific_name AS muscle_scientific_name
		FROM exercise_muscles em
		JOIN exercises e ON em.exercise_id = e.id
		JOIN muscles m ON em.muscle_id = m.id
	`);
	return rows;
}

export { postNewExerciseMuscle, getAllExerciseMusclesWithJoins };
