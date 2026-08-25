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

/** @param {{variantId: number, exerciseId: number, name: string, equipmentId: number}} input @param {any} db */
export async function update(
	{ variantId, exerciseId, name, equipmentId },
	db = pool,
) {
	const { rowCount } = await db.query(
		`UPDATE exercise_variants
		 SET name = $3, equipment_id = $4
		 WHERE id = $1 AND exercise_id = $2`,
		[variantId, exerciseId, name, equipmentId],
	);
	return rowCount > 0;
}
