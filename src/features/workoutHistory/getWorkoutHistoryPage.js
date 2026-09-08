import * as repository from "./repository.js";
import { toWorkoutHistoryPage } from "./mapper.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */

export const DEFAULT_HISTORY_PAGE_SIZE = 20;
export const MAX_HISTORY_PAGE_SIZE = 50;
export const MAX_HISTORY_PAGE = 10_000;

/** @param {number | undefined} value @param {number} fallback @param {number} maximum */
function boundedInteger(value, fallback, maximum) {
	return typeof value === "number" && Number.isInteger(value) && value >= 1
		? Math.min(value, maximum)
		: fallback;
}

/**
 * @param {import("./workoutHistory.types.js").WorkoutHistoryPageInput} input
 * @param {DatabaseClient} [db]
 */
export default async function getWorkoutHistoryPage(input, db) {
	const page = boundedInteger(input.page, 1, MAX_HISTORY_PAGE);
	const pageSize = boundedInteger(
		input.pageSize,
		DEFAULT_HISTORY_PAGE_SIZE,
		MAX_HISTORY_PAGE_SIZE,
	);
	const row = await repository.findPageForUser({ ...input, page, pageSize }, db);
	return toWorkoutHistoryPage(row, { page, pageSize });
}
