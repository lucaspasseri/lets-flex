import pool from "../../../db/pool.js";

export async function create({ name, movementPatternId }, db = pool) {
	const { rows } = await db.query(
		"INSERT INTO exercises (name, movement_pattern_id) VALUES ($1, $2) RETURNING *",
		[name, movementPatternId],
	);

	return rows[0] ?? null;
}

export async function deleteById({ exerciseId }, db = pool) {
	await db.query("DELETE FROM exercises WHERE id = $1", [exerciseId]);
}
