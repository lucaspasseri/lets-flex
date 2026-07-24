async function getWorkoutSessionByProgramId(db, { programId }) {
	if (programId === null) return [];

	const { rows } = await db.query(
		`
		SELECT workoutSession.*, 
		trainingDay.cycle_id AS cycle_id, 
		trainingDay.day_order AS day_order, 
		trainingDay.scheduled_date AS scheduled_date,
		cycle.program_id AS program_id,
		cycle.name AS cycle_name,
		cycle.cycle_size AS cycle_size,
		cycle.cycle_order AS cycle_order,
		session.name AS session_name,
		session.notes AS session_notes


		FROM workout_sessions AS workoutSession
		JOIN training_days AS trainingDay ON workoutSession.training_day_id = trainingDay.id
		JOIN cycles AS cycle ON trainingDay.cycle_id = cycle.id
		JOIN sessions AS session ON workoutSession.session_id = session.id

		WHERE cycle.program_id = $1

		ORDER BY
		cycle_order,
		day_order
	`,
		[programId],
	);

	return rows;
}

export default getWorkoutSessionByProgramId;
