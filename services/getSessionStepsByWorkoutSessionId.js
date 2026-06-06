async function getSessionStepsByWorkoutSessionId(db, { workoutSessionId }) {
	if (workoutSessionId === null) return [];

	const { rows } = await db.query(
		`
	SELECT ss.*, ev.name AS exercise_variant_name

	FROM session_steps AS ss

	JOIN exercise_variants AS ev
		ON ss.exercise_variant_id = ev.id

	JOIN sessions AS se
		ON ss.session_id = se.id

	JOIN workout_sessions AS ws
		ON ws.session_id = se.id

	WHERE ws.id = $1

	ORDER BY
		ss.step_order
	`,
		[workoutSessionId],
	);

	return rows;
}

export default getSessionStepsByWorkoutSessionId;
