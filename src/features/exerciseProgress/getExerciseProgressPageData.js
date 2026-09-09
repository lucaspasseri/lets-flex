import * as usersRepository from "../users/repository.js";
import * as userMapper from "../users/mapper.js";
import * as programsRepository from "../programs/repository.js";
import * as programMapper from "../programs/mapper.js";
import getExerciseProgress from "./getExerciseProgress.js";
import getExerciseProgressChoices from "./getExerciseProgressChoices.js";

/**
 * @param {{userId: number, query: import("./exerciseProgressPage.types.js").ExerciseProgressPageQuery}} input
 * @returns {Promise<import("./exerciseProgressPage.types.js").ExerciseProgressPageData>}
 */
export default async function getExerciseProgressPageData({ userId, query }) {
	const [userRow, programRows, choices, progress] = await Promise.all([
		usersRepository.findById({ userId }),
		programsRepository.findAllByUserId({ userId }),
		query.programId
			? getExerciseProgressChoices({ userId, programId: query.programId })
			: Promise.resolve([]),
		query.programId && query.exerciseKey
			? getExerciseProgress({
					userId,
					programId: query.programId,
					exerciseKey: query.exerciseKey,
					filters: {
						fromDate: query.fromDate,
						toDate: query.toDate,
					},
					pointLimit: query.pointLimit,
				})
			: Promise.resolve(null),
	]);
	const programs = programRows.map(programMapper.toProgram);

	return {
		currentUser: userRow ? userMapper.toLoggedUser(userRow) : null,
		programs,
		choices,
		progress,
	};
}
