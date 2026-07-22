import pool from "../../../db/pool.js";

export async function create({ name, exerciseId, equipmentId }, db = pool) {
	await db.query(
		"INSERT INTO exercise_variants (name, exercise_id, equipment_id) VALUES ($1, $2, $3)",
		[name, exerciseId, equipmentId],
	);
}
