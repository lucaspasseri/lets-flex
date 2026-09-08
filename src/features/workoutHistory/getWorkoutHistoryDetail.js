import * as repository from "./repository.js";
import { toWorkoutHistoryDetail } from "./mapper.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */

/**
 * @param {{workoutSessionId: number, userId: number}} input
 * @param {DatabaseClient} [db]
 * @returns {Promise<import("./workoutHistory.types.js").WorkoutHistoryDetail | null>}
 */
export default async function getWorkoutHistoryDetail(input, db) {
	const row = await repository.findDetailForUser(input, db);
	return row ? toWorkoutHistoryDetail(row) : null;
}
