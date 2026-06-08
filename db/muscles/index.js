async function getAllMuscles(db) {
	const { rows } = await db.query("SELECT * FROM muscles");
	return rows;
}

export { getAllMuscles };
