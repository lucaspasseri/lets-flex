async function getTrainingDaysByProgramId(db, { programId }) {
	if (programId === null) return [];

	const { rows } = await db.query(
		"SELECT training_days.id AS training_day_id, training_days.day_order, cycle_id, cycle_order, program_id, scheduled_date FROM training_days JOIN cycles ON training_days.cycle_id = cycles.id WHERE cycles.program_id = $1 ORDER BY cycles.cycle_order, training_days.day_order",
		[programId],
	);

	return rows;
}

export default getTrainingDaysByProgramId;
