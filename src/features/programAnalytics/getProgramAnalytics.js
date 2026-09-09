import * as repository from "./repository.js";
import { toProgramAnalytics } from "./mapper.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */

/**
 * @param {{programId: number, userId: number}} input
 * @param {DatabaseClient} [db]
 * @returns {Promise<import("./programAnalytics.types.js").ProgramAnalytics | null>}
 */
export default async function getProgramAnalytics({ programId, userId }, db) {
	const row = await repository.findByProgramIdForUser({ programId, userId }, db);
	return row ? toProgramAnalytics(row) : null;
}
