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

export { insertWorkoutSession, getWorkoutSessionById };
