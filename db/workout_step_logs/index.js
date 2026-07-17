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

async function insertWorkoutStepLogsFromSessionSteps(
	db,
	{ workoutSessionId, sessionId },
) {
	const { rows } = await db.query(
		`
		INSERT INTO workout_step_logs (
			workout_session_id,
			session_step_id,
			status,
			step_order,
			step_type_id,
			exercise_variant_id,
			name,
			planned_sets,
			planned_reps,
			planned_load_value,
			planned_load_unit
		)
		SELECT
			$1,
			ss.id,
			'planned',
			ss.step_order,
			ss.step_type_id,
			ss.exercise_variant_id,
			ss.name,
			ss.sets,
			ss.reps,
			ss.load_value,
			ss.load_unit
		FROM session_steps ss
		WHERE ss.session_id = $2
		ORDER BY ss.step_order
		RETURNING *
		`,
		[workoutSessionId, sessionId],
	);

	return rows;
}

async function updateWorkoutStepLogStatus(db, { workoutStepLogId, status }) {
	const { rows } = await db.query(
		"UPDATE workout_step_logs SET status = $1, completed_at = NOW() WHERE id = $2 RETURNING *",
		[status, workoutStepLogId],
	);

	return rows[0];
}

export {
	insertWorkoutStepLogBySessionIdAndWorkoutSessionId,
	getWorkoutStepLogsByWorkoutSessionId,
	updateWorkoutStepLogStatus,
	insertWorkoutStepLogsFromSessionSteps,
};
