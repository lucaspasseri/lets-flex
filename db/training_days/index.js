async function insertTrainingDay(
	db,
	{ cycleId, dayOrder, label, scheduledDate },
) {
	const { rows } = await db.query(
		"INSERT INTO training_days ( cycle_id, day_order, label, scheduled_date) VALUES ($1, $2, $3, $4) RETURNING *",
		[cycleId, dayOrder, label, scheduledDate],
	);

	return rows[0];
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

async function getTrainingDaysByCycleId(db, { cycleId }) {
	if (cycleId === null) return [];

	const { rows } = await db.query(
		"SELECT * FROM training_days WHERE cycle_id = $1 ORDER BY day_order",
		[cycleId],
	);

	return rows;
}

async function shiftScheduledDatesFromCycleOrder(
	db,
	{ programId, cycleOrder, amountOfDays },
) {
	await db.query(
		`
			UPDATE training_days td
			SET scheduled_date = td.scheduled_date + ($3::int * INTERVAL '1 day')
			FROM cycles c
			WHERE td.cycle_id = c.id
				AND c.program_id = $1
				AND c.cycle_order > $2
		`,
		[programId, cycleOrder, amountOfDays],
	);
}

async function getTrainingDayByScheduledDate(db, { scheduledDate }) {
	const { rows } = await db.query(
		"SELECT * FROM training_days WHERE scheduled_date = $1",
		[scheduledDate],
	);

	if (rows.length === 0) {
		return null;
	}

	return rows[0];
}

async function getTrainingDayByScheduledDateAndProgramId(
	db,
	{ scheduledDate, programId },
) {
	const { rows } = await db.query(
		"SELECT * FROM training_days WHERE scheduled_date = $1 AND cycle_id IN (SELECT id FROM cycles WHERE program_id = $2)",
		[scheduledDate, programId],
	);

	if (rows.length === 0) {
		return null;
	}

	return rows[0];
}

async function getTrainingDaysByProgramId(db, { programId }) {
	if (programId === null) return [];

	const { rows } = await db.query(
		"SELECT training_days.id AS training_day_id, training_days.day_order, cycle_id, cycle_order, program_id, scheduled_date FROM training_days JOIN cycles ON training_days.cycle_id = cycles.id WHERE cycles.program_id = $1 ORDER BY cycles.cycle_order, training_days.day_order",
		[programId],
	);

	return rows;
}

export {
	insertTrainingDay,
	getTrainingDayById,
	getTrainingDaysByCycleId,
	shiftScheduledDatesFromCycleOrder,
	getTrainingDayByScheduledDate,
	getTrainingDayByScheduledDateAndProgramId,
	getTrainingDaysByProgramId,
};
