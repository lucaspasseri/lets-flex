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
	console.log("a");
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

	console.log("b");

	return rows[0] ?? null;
}
