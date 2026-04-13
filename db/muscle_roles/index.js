import pool from "../pool.js";

async function getAllMuscleRoles() {
	const { rows: muscleRoles } = await pool.query("SELECT * FROM muscle_roles");

	return muscleRoles;
}

export { getAllMuscleRoles };
