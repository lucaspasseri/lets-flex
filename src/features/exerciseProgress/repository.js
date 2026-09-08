import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */

/**
 * @param {{userId: number, programId: number}} input
 * @param {DatabaseClient} [db]
 * @returns {Promise<import("./exerciseProgress.types.js").ExerciseProgressChoiceRow[]>}
 */
export async function findChoicesForUser({ userId, programId }, db = pool) {
	const { rows } = await db.query(queries.findChoicesForUser(), [userId, programId]);
	return rows;
}

/**
 * @param {object} input
 * @param {number} input.userId
 * @param {number} input.programId
 * @param {import("./exerciseProgress.types.js").ExerciseProgressIdentity} input.identity
 * @param {import("./exerciseProgress.types.js").ExerciseProgressFilters} input.filters
 * @param {number} input.pointLimit
 * @param {DatabaseClient} [db]
 * @returns {Promise<import("./exerciseProgress.types.js").ExerciseProgressRow | null>}
 */
export async function findProgressForUser(
	{ userId, programId, identity, filters, pointLimit },
	db = pool,
) {
	const { rows } = await db.query(queries.findProgressForUser(), [
		userId,
		programId,
		identity.exerciseName,
		identity.exerciseVariantName,
		filters.fromDate,
		filters.toDate,
		pointLimit,
	]);
	return rows[0] ?? null;
}
