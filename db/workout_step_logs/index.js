async function insertWorkoutStepLog(db, { sessionStepId }) {
	const { rows } = await db.query(
		"INSERT INTO workout_step_logs (session_step_id) VALUES ($1) RETURNING *",
		[sessionStepId],
	);

	return rows[0];
}

async function insertWorkoutStepLogBySessionIdAndWorkoutSessionId(
	db,
	{ sessionId, workoutSessionId },
) {
	const { rows } = await db.query(
		`
		INSERT INTO workout_step_logs (
			session_step_id,
			status,
			planned_sets,
			planned_reps,
			planned_load_value,
			planned_load_unit,
			workout_session_id
		)
		SELECT
			id,
			'planned',
			sets,
			reps,
			load_value,
			load_unit,
			$2
		FROM session_steps
		WHERE session_id = $1
		RETURNING *
		`,
		[sessionId, workoutSessionId],
	);

	return rows;
}

export { insertWorkoutStepLogBySessionIdAndWorkoutSessionId };
