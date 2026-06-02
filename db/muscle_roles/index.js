async function getAllMuscleRoles(db) {
	const { rows: muscleRoles } = await db.query("SELECT * FROM muscle_roles");

	return muscleRoles;
}

export { getAllMuscleRoles };
