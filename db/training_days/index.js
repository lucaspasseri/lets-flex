async function insertTrainingDay(db, { cycleId, dayOrder, label }) {
	const { rows } = await db.query(
		"INSERT INTO training_days ( cycle_id, day_order, label) VALUES ($1, $2, $3) RETURNING *",
		[cycleId, dayOrder, label],
	);

	return rows[0];
}

async function getTrainingDaysByCycleId(db, { cycleId }) {
	if (cycleId === null) return [];

	const { rows } = await db.query(
		"SELECT * FROM training_days WHERE cycle_id = $1 ORDER BY day_order",
		[cycleId],
	);

	return rows;
}

async function getTrainingDayById(db, { trainingDayId }) {
	const { rows } = await db.query("SELECT * FROM training_days WHERE id = $1", [
		trainingDayId,
	]);

	if (rows.length === 0) {
		return null;
	}

	return rows[0];
}

export { insertTrainingDay, getTrainingDaysByCycleId, getTrainingDayById };
