import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */

/**
 * @param {import("./workoutHistory.types.js").WorkoutHistoryPageInput} input
 * @param {DatabaseClient} [db]
 * @returns {Promise<import("./workoutHistory.types.js").WorkoutHistoryPageRow>}
 */
export async function findPageForUser(
	{ userId, filters, page = 1, pageSize = 20 },
	db = pool,
) {
	const offset = (page - 1) * pageSize;
	const { rows } = await db.query(queries.findPageForUser(), [
		userId,
		filters.programId,
		filters.fromDate,
		filters.toDate,
		pageSize,
		offset,
	]);
	return rows[0] ?? { total_count: 0, items: [] };
}

/**
 * @param {{workoutSessionId: number, userId: number}} input
 * @param {DatabaseClient} [db]
 * @returns {Promise<import("./workoutHistory.types.js").WorkoutHistoryDetailRow | null>}
 */
export async function findDetailForUser({ workoutSessionId, userId }, db = pool) {
	const { rows } = await db.query(queries.findDetailForUser(), [
		workoutSessionId,
		userId,
	]);
	return rows[0] ?? null;
}
