import pool from "../../../db/pool.js";

export async function create(
	{
		sessionId,
		stepTypeId,
		exerciseVariantId,
		name,
		stepOrder,
		sets,
		reps,
		loadValue,
		loadUnit,
	},
	db = pool,
) {
	const { rows } = await db.query(
		"INSERT INTO session_steps (session_id, step_type_id, exercise_variant_id, name, step_order, sets, reps, load_value, load_unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
		[
			sessionId,
			stepTypeId,
			exerciseVariantId,
			name,
			stepOrder,
			sets,
			reps,
			loadValue,
			loadUnit,
		],
	);

	return rows[0] ?? null;
}

/** @param {{sessionId: number}} input @param {any} db */
export async function moveOrdersOutOfWay({ sessionId }, db = pool) {
	await db.query(
		"UPDATE session_steps SET step_order = -id WHERE session_id = $1",
		[sessionId],
	);
}

/** @param {any} input @param {any} db */
export async function update(
	{
		stepId,
		sessionId,
		stepTypeId,
		exerciseVariantId,
		name,
		stepOrder,
		sets,
		reps,
		loadValue,
		loadUnit,
	},
	db = pool,
) {
	const { rowCount } = await db.query(
		`UPDATE session_steps
		 SET step_type_id = $3, exercise_variant_id = $4, name = $5,
		     step_order = $6, sets = $7, reps = $8, load_value = $9,
		     load_unit = $10
		 WHERE id = $1 AND session_id = $2`,
		[
			stepId,
			sessionId,
			stepTypeId,
			exerciseVariantId,
			name,
			stepOrder,
			sets,
			reps,
			loadValue,
			loadUnit,
		],
	);
	return rowCount > 0;
}

/** @param {{sessionId: number, stepIds: number[]}} input @param {any} db */
export async function deleteExcept({ sessionId, stepIds }, db = pool) {
	if (stepIds.length === 0) {
		await db.query("DELETE FROM session_steps WHERE session_id = $1", [
			sessionId,
		]);
		return;
	}
	await db.query(
		"DELETE FROM session_steps WHERE session_id = $1 AND NOT (id = ANY($2::int[]))",
		[sessionId, stepIds],
	);
}
