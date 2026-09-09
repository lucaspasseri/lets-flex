import * as repository from "./repository.js";
import { fromExerciseProgressKey, toExerciseProgress } from "./mapper.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */

export const DEFAULT_EXERCISE_PROGRESS_POINT_LIMIT = 100;
export const MAX_EXERCISE_PROGRESS_POINT_LIMIT = 200;

/** @param {number | undefined} value */
function boundedPointLimit(value) {
	return typeof value === "number" && Number.isInteger(value) && value >= 1
		? Math.min(value, MAX_EXERCISE_PROGRESS_POINT_LIMIT)
		: DEFAULT_EXERCISE_PROGRESS_POINT_LIMIT;
}

/**
 * @param {import("./exerciseProgress.types.js").ExerciseProgressInput} input
 * @param {DatabaseClient} [db]
 * @returns {Promise<import("./exerciseProgress.types.js").ExerciseProgress | null>}
 */
export default async function getExerciseProgress(input, db) {
	const identity = fromExerciseProgressKey(input.exerciseKey);
	if (!identity) return null;
	const pointLimit = boundedPointLimit(input.pointLimit);
	const row = await repository.findProgressForUser(
		{ ...input, identity, pointLimit },
		db,
	);
	return row
		? toExerciseProgress(row, {
				programId: input.programId,
				filters: input.filters,
				pointLimit,
			})
		: null;
}
