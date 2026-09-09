import * as repository from "./repository.js";
import { toExerciseProgressChoice } from "./mapper.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */

/**
 * @param {{userId: number, programId: number}} input
 * @param {DatabaseClient} [db]
 * @returns {Promise<import("./exerciseProgress.types.js").ExerciseProgressChoice[]>}
 */
export default async function getExerciseProgressChoices(input, db) {
	const rows = await repository.findChoicesForUser(input, db);
	return rows.map(toExerciseProgressChoice).filter(
		/** @returns {choice is import("./exerciseProgress.types.js").ExerciseProgressChoice} */
		(choice) => choice !== null,
	);
}
