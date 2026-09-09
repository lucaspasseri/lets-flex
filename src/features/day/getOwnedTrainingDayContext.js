import * as trainingDaysRepository from "../trainingDays/repository.js";
import { toTrainingDayContext } from "../trainingDays/mapper.js";

/**
 * @param {{dayId: number | null, userId: number | null}} input
 * @param {import("pg").Pool | import("pg").PoolClient} [db]
 * @returns {Promise<import("../trainingDays/trainingDays.types.js").TrainingDayContext | null>}
 */
export default async function getOwnedTrainingDayContext({ dayId, userId }, db) {
	if (!dayId || !userId) return null;

	const row = await trainingDaysRepository.findContextByIdForUser(
		{ trainingDayId: dayId, userId },
		db,
	);
	return row ? toTrainingDayContext(row) : null;
}
