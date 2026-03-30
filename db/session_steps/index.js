import toNullableNumber from "../../utils/toNullableNumber.js";
import pool from "../pool.js";

async function getAllSessionSteps() {
	const { rows } = await pool.query("SELECT * FROM session_steps");
	return rows;
}

async function getAllSessionStepsWithJoins() {
	const { rows: sessionSteps } = await pool.query(
		`SELECT session_steps.*, sessions.name AS session_name, step_types.name AS step_type_name, exercise_variants.name AS exercise_variant_name 
		FROM session_steps JOIN sessions ON session_steps.session_id = sessions.id 
		JOIN step_types ON session_steps.step_type_id = step_types.id
		JOIN exercise_variants ON session_steps.exercise_variant_id = exercise_variants.id
		`,
	);

	return sessionSteps;
}

async function getSessionStepsBySessionId(sessionId) {
	const { rows } = await pool.query(
		"SELECT * FROM session_steps WHERE session_id = $1 ORDER BY step_order",
		[sessionId],
	);
	return rows;
}

async function postNewSessionStep(
	sessionId,
	stepTypeId,
	stepOrder,
	name,
	exerciseVariantId,
) {
	const { rows: existSession } = await pool.query(
		"SELECT COUNT(*) FROM sessions WHERE id = $1",
		[sessionId],
	);

	if (existSession.length === 0) {
		throw new Error(`Session with ID ${sessionId} was not found`);
	}

	const { rows: howManySteps } = await pool.query(
		"SELECT COUNT(*) FROM session_steps WHERE session_id = $1",
		[sessionId],
	);

	const numberOfSteps = Number(howManySteps[0].count);

	if (Number(stepOrder) > numberOfSteps + 1) {
		throw new Error(`Step order must be at most ${numberOfSteps + 1}`);
	}

	if (Number(stepOrder) === numberOfSteps + 1) {
		await pool.query(
			"INSERT INTO session_steps (session_id, step_type_id, step_order, name, exercise_variant_id) VALUES ($1, $2, $3, $4, $5)",
			[
				sessionId,
				stepTypeId,
				Number(stepOrder),
				name,
				toNullableNumber(exerciseVariantId),
			],
		);
		return;
	}

	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		await client.query(
			"UPDATE session_steps SET step_order = step_order + 1 WHERE session_id = $1 AND step_order >= $2",
			[sessionId, Number(stepOrder)],
		);

		await client.query(
			"INSERT INTO session_steps (session_id, step_type_id, step_order, name, exercise_variant_id) VALUES ($1, $2, $3, $4, $5)",
			[
				sessionId,
				stepTypeId,
				Number(stepOrder),
				name,
				toNullableNumber(exerciseVariantId),
			],
		);

		await client.query("COMMIT");
	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

export {
	getAllSessionSteps,
	getAllSessionStepsWithJoins,
	getSessionStepsBySessionId,
	postNewSessionStep,
};
