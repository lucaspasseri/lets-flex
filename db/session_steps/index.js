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
	name,
	sessionId,
	stepTypeId,
	exerciseVariantId,
	stepOrder,
	sets,
	reps,
	loadValue,
	loadUnit,
) {
	const numericSessionId = toNullableNumber(sessionId);
	const numericStepTypeId = toNullableNumber(stepTypeId);
	const numericExerciseVariantId = toNullableNumber(exerciseVariantId);
	const numericStepOrder = Number(stepOrder);

	const numericSets = toNullableNumber(sets);
	const numericReps = toNullableNumber(reps);
	const numericLoadValue = toNullableNumber(loadValue);

	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const { rows: existSession } = await client.query(
			"SELECT id FROM sessions WHERE id = $1",
			[numericSessionId],
		);

		if (existSession.length === 0) {
			throw new Error(`Session with ID ${sessionId} was not found`);
		}

		await client.query(
			"SELECT id FROM session_steps WHERE session_id = $1 FOR UPDATE",
			[numericSessionId],
		);

		const { rows: howManySteps } = await client.query(
			"SELECT COUNT(*) FROM session_steps WHERE session_id = $1",
			[numericSessionId],
		);

		const numberOfSteps = Number(howManySteps[0].count);

		if (numericStepOrder > numberOfSteps + 1) {
			throw new Error(`Step order must be at most ${numberOfSteps + 1}`);
		}

		if (numericStepOrder < 1 || !Number.isInteger(numericStepOrder)) {
			throw new Error("Step order must be a positive integer");
		}

		// Move affected rows far away first to avoid unique constraint collisions
		await client.query(
			`
			UPDATE session_steps
			SET step_order = step_order + 1000
			WHERE session_id = $1
			AND step_order >= $2
			`,
			[numericSessionId, numericStepOrder],
		);

		await client.query(
			`
			INSERT INTO session_steps (
				session_id,
				step_type_id,
				exercise_variant_id,
				step_order,
				name,
				sets,
				reps,
				load_value,
				load_unit
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			`,
			[
				numericSessionId,
				numericStepTypeId,
				numericExerciseVariantId,
				numericStepOrder,
				name,
				numericSets,
				numericReps,
				numericLoadValue,
				loadUnit || null,
			],
		);

		// Bring shifted rows back to the correct order
		await client.query(
			`
			UPDATE session_steps
			SET step_order = step_order - 999
			WHERE session_id = $1
			AND step_order >= $2
			`,
			[numericSessionId, numericStepOrder + 1000],
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
