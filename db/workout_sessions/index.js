async function insertWorkoutSession(db, { sessionId }) {
	const { rows } = await db.query(
		"INSERT INTO workout_sessions (session_id) VALUES ($1) RETURNING *",
		[sessionId],
	);

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
};
