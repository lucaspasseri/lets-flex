import pool from "../../../db/pool.js";

/**
 * @typedef {import("./exerciseVariants.types.js").CreateExerciseVariantInput} CreateExerciseVariantInput
 */

/**
 * @param {CreateExerciseVariantInput} input
 */

export async function create({ name, exerciseId, equipmentId }, db = pool) {
	await db.query(
		"INSERT INTO exercise_variants (name, exercise_id, equipment_id) VALUES ($1, $2, $3)",
		[name, exerciseId, equipmentId],
	);
}
