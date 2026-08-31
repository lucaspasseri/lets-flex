import pool from "../../../db/pool.js";

/**
 * @typedef {import("./exerciseVariants.types.js").CreateExerciseVariantInput} CreateExerciseVariantInput
 * @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient
 */

/**
 * @param {CreateExerciseVariantInput} input
 * @param {DatabaseClient} [db]
 */

export async function create({ name, exerciseId, equipmentId }, db = pool) {
	await db.query(
		"INSERT INTO exercise_variants (name, exercise_id, equipment_id) VALUES ($1, $2, $3)",
		[name, exerciseId, equipmentId],
	);
}

/** @param {{name: string, exerciseId: number, equipmentId: number | null, ownerUserId: number}} input @param {DatabaseClient} [db] */
export async function createPrivate(
	{ name, exerciseId, equipmentId, ownerUserId },
	db = pool,
) {
	const { rows } = await db.query(
		`INSERT INTO exercise_variants (name, exercise_id, equipment_id, owner_user_id)
		 SELECT $1, e.id, $3, $4 FROM exercises e
		 WHERE e.id = $2 AND e.is_archived = FALSE
		 RETURNING *`,
		[name.trim(), exerciseId, equipmentId, ownerUserId],
	);
	return rows[0] ?? null;
}

/** @param {{name: string, exerciseId: number, equipmentId: number | null}} input @param {DatabaseClient} [db] */
export async function createGlobal({ name, exerciseId, equipmentId }, db = pool) {
	const { rows } = await db.query(
		`INSERT INTO exercise_variants (name, exercise_id, equipment_id)
		 SELECT $1, e.id, $3 FROM exercises e
		 WHERE e.id = $2 AND e.is_archived = FALSE
		 RETURNING *`,
		[name.trim(), exerciseId, equipmentId],
	);
	return rows[0] ?? null;
}

/** @param {{variantId: number, name: string, equipmentId: number | null, ownerUserId: number}} input @param {DatabaseClient} [db] */
export async function updatePrivate(
	{ variantId, name, equipmentId, ownerUserId },
	db = pool,
) {
	const { rows } = await db.query(
		`UPDATE exercise_variants
		 SET name = $2, equipment_id = $3, updated_at = NOW()
		 WHERE id = $1 AND owner_user_id = $4 AND is_archived = FALSE
		 RETURNING *`,
		[variantId, name.trim(), equipmentId, ownerUserId],
	);
	return rows[0] ?? null;
}

/** @param {{variantId: number, ownerUserId: number}} input @param {DatabaseClient} [db] */
export async function archivePrivate({ variantId, ownerUserId }, db = pool) {
	const { rows } = await db.query(
		`UPDATE exercise_variants SET is_archived = TRUE, updated_at = NOW()
		 WHERE id = $1 AND owner_user_id = $2 AND is_archived = FALSE
		 RETURNING *`,
		[variantId, ownerUserId],
	);
	return rows[0] ?? null;
}

/** @param {{variantId: number, userId: number}} input @param {DatabaseClient} [db] */
export async function isVisibleToUser({ variantId, userId }, db = pool) {
	const { rows } = await db.query(
		`SELECT 1 FROM exercise_variants ev
		 JOIN exercises e ON e.id = ev.exercise_id
		 WHERE ev.id = $1 AND (ev.owner_user_id IS NULL OR ev.owner_user_id = $2)
		   AND ev.is_archived = FALSE AND e.is_archived = FALSE`,
		[variantId, userId],
	);
	return rows.length > 0;
}

/** @param {{variantId: number, exerciseId: number, name: string, equipmentId: number}} input @param {any} db */
export async function update({ variantId, exerciseId, name, equipmentId }, db = pool) {
	const { rowCount } = await db.query(
		`UPDATE exercise_variants
		 SET name = $3, equipment_id = $4
		 WHERE id = $1 AND exercise_id = $2 AND owner_user_id IS NULL`,
		[variantId, exerciseId, name, equipmentId],
	);
	return rowCount > 0;
}
