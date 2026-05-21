async function getWorkoutStepLogsByWorkoutSessionId(db, { workoutSessionId }) {
	const { rows } = await db.query(
		`
		SELECT
			wsl.*,
			ss.step_order AS session_step_order,
			ss.name AS session_name
		FROM workout_step_logs AS wsl
		JOIN session_steps AS ss
			ON ss.id = wsl.session_step_id
		WHERE wsl.workout_session_id = $1
		ORDER BY ss.step_order
		`,
		[workoutSessionId],
	);

	return rows;
}

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

export {
	insertWorkoutStepLogBySessionIdAndWorkoutSessionId,
	getWorkoutStepLogsByWorkoutSessionId,
};
