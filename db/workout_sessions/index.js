async function insertWorkoutSession(
	db,
	{ sessionId, trainingDayId, workoutSessionOrder, notes },
) {
	const { rows } = await db.query(
		"INSERT INTO workout_sessions (session_id, training_day_id, workout_session_order, notes) VALUES ($1, $2, $3, $4) RETURNING *",
		[sessionId, trainingDayId, workoutSessionOrder, notes],
	);

	return rows[0];
}

async function getWorkoutSessionById(db, { workoutSessionId }) {
	const { rows } = await db.query(
		`
		SELECT workoutSessions.*, sessionsTemplate.name, sessionsTemplate.notes AS session_notes
		FROM workout_sessions AS workoutSessions
		JOIN sessions AS sessionsTemplate
		ON workoutSessions.session_id = sessionsTemplate.id
		WHERE workoutSessions.id = $1
		`,
		[workoutSessionId],
	);

	if (rows.length === 0) {
		return null;
	}

	return rows[0];
}

async function getWorkoutSessionByTrainingDayId(db, { trainingDayId }) {
	const { rows } = await db.query(
		`
		SELECT workoutSessions.*, sessionsTemplate.name, sessionsTemplate.notes AS session_notes
		FROM workout_sessions AS workoutSessions
		JOIN sessions AS sessionsTemplate
		ON workoutSessions.session_id = sessionsTemplate.id
		WHERE training_day_id = $1
		`,
		[trainingDayId],
	);

	return rows;
}

async function getWorkoutSessionWithStepsInfoByTrainingDayId(
	db,
	{ trainingDayId },
) {
	const { rows } = await db.query(
		`
		SELECT
			ws.id,
			ws.training_day_id,
			ws.session_id,
			ws.workout_session_order,
			ws.status,
			ws.started_at,
			ws.finished_at,
			ws.notes,

			se.name,
			se.is_archived,
			se.notes AS session_notes,

			(
				SELECT COALESCE(
					json_agg(
						json_build_object(
							'id', ss.id,
							'name', ss.name,
							'sets', ss.sets,
							'reps', ss.reps,
							'load_value', ss.load_value,
							'load_unit', ss.load_unit,
							'step_order', ss.step_order,
							'step_type_name', st.name,
							'exercise_variant_name', ev.name,
							'exercise_name', ex.name,
							'movement_pattern_name', mp.name,
							'equipment_name', eq.name,
							'equipment_category', eq.category,
							'muscles', (
								SELECT COALESCE(
									json_agg(
										json_build_object(
											'common_name', m.common_name,
											'scientific_name', m.scientific_name
										)
									),
									'[]'
								)
								FROM exercise_muscles AS em
								JOIN muscles AS m
									ON em.muscle_id = m.id
								WHERE em.exercise_id = ex.id
							)
						)
						ORDER BY ss.step_order
					),
					'[]'
				)
				FROM session_steps AS ss
				JOIN step_types AS st
					ON ss.step_type_id = st.id
				JOIN exercise_variants AS ev
					ON ss.exercise_variant_id = ev.id
				JOIN exercises AS ex
					ON ev.exercise_id = ex.id
				JOIN movement_patterns AS mp
					ON ex.movement_pattern_id = mp.id
				JOIN equipments AS eq
					ON ev.equipment_id = eq.id
				WHERE ss.session_id = se.id
			) AS steps

		FROM workout_sessions AS ws
		JOIN sessions AS se
			ON ws.session_id = se.id
		WHERE ws.training_day_id = $1
		ORDER BY ws.workout_session_order;
		`,
		[trainingDayId],
	);

	return rows;
}

async function getWorkoutSessionInProgressBySessionId(db, { sessionId }) {
	const { rows } = await db.query(
		"SELECT * FROM workout_sessions WHERE status = 'in_progress' AND session_id = $1",
		[sessionId],
	);

	return rows[0];
}

async function getWorkoutSessionBySessionId(db, { sessionId }) {
	const { rows } = await db.query(
		"SELECT * FROM workout_sessions WHERE session_id = $1",
		[sessionId],
	);

	return rows;
}

async function startWorkoutSession(db, { workoutSessionId }) {
	const { rows } = await db.query(
		`
		UPDATE workout_sessions
		SET
			status = 'in_progress',
			started_at = NOW()
		WHERE id = $1
			AND status = 'planned'
		RETURNING *
		`,
		[workoutSessionId],
	);

	return rows[0];
}

async function finishWorkoutSession(db, { workoutSessionId }) {
	const { rows } = await db.query(
		`
		UPDATE workout_sessions
		SET
			status = 'finished',
			finished_at = NOW()
		WHERE id = $1
		RETURNING *
		`,
		[workoutSessionId],
	);

	return rows[0];
}

async function cancelWorkoutSession(db, { workoutSessionId }) {
	const { rows } = await db.query(
		`
		UPDATE workout_sessions
		SET
			status = 'cancelled'
		WHERE id = $1
		RETURNING *
		`,
		[workoutSessionId],
	);

	return rows[0];
}

export {
	insertWorkoutSession,
	getWorkoutSessionById,
	getWorkoutSessionInProgressBySessionId,
	startWorkoutSession,
	finishWorkoutSession,
	cancelWorkoutSession,
	getWorkoutSessionBySessionId,
	getWorkoutSessionByTrainingDayId,
	getWorkoutSessionWithStepsInfoByTrainingDayId,
};
