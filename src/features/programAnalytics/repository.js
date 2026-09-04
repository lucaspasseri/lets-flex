import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */

/**
 * Returns analytics only when the program belongs to the supplied user.
 *
 * @param {{programId: number, userId: number}} input
 * @param {DatabaseClient} [db]
 * @returns {Promise<import("./programAnalytics.types.js").ProgramAnalyticsRow | null>}
 */
export async function findByProgramIdForUser({ programId, userId }, db = pool) {
	const { rows } = await db.query(queries.findByProgramIdForUser(), [
		programId,
		userId,
	]);
	return rows[0] ?? null;
}
