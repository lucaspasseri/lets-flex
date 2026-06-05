async function insertWorkoutSession(
	db,
	{ sessionId, trainingDayId, workoutSessionOrder, notes },
) {
	console.log(1);
	const { rows } = await db.query(
		"INSERT INTO workout_sessions (session_id, training_day_id, workout_session_order, notes) VALUES ($1, $2, $3, $4) RETURNING *",
		[sessionId, trainingDayId, workoutSessionOrder, notes],
	);
	console.log({ rows });

	return rows[0];
}

async function getWorkoutSessionById(db, { workoutSessionId }) {
	const { rows } = await db.query(
		"SELECT * FROM workout_sessions WHERE id = $1",
		[workoutSessionId],
	);

	if (rows.length === 0) {
		return null;
	}

	return rows[0];
}
// "SELECT * FROM workout_sessions WHERE training_day_id = $1"
async function getWorkoutSessionByTrainingDayId(db, { trainingDayId }) {
	const { rows } = await db.query(
		`
		SELECT workoutSessions.*, sessionsTemplate.name, sessionsTemplate.notes
		FROM workout_sessions AS workoutSessions
		JOIN sessions AS sessionsTemplate
		ON workoutSessions.session_id = sessionsTemplate.id
		WHERE training_day_id = $1
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

export {
	insertWorkoutSession,
	getWorkoutSessionById,
	getWorkoutSessionInProgressBySessionId,
	finishWorkoutSession,
	getWorkoutSessionBySessionId,
	getWorkoutSessionByTrainingDayId,
};
