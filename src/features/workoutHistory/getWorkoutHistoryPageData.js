import * as usersRepository from "../users/repository.js";
import * as userMapper from "../users/mapper.js";
import * as programsRepository from "../programs/repository.js";
import * as programMapper from "../programs/mapper.js";
import getWorkoutHistoryPage from "./getWorkoutHistoryPage.js";
import getWorkoutHistoryDetail from "./getWorkoutHistoryDetail.js";

/**
 * @param {import("./workoutHistory.types.js").WorkoutHistoryPageInput} input
 */
export async function getWorkoutHistoryListPageData(input) {
	const [userRow, programRows, history] = await Promise.all([
		usersRepository.findById({ userId: input.userId }),
		programsRepository.findAllByUserId({ userId: input.userId }),
		getWorkoutHistoryPage(input),
	]);

	return {
		currentUser: userRow ? userMapper.toLoggedUser(userRow) : null,
		programs: programRows.map(programMapper.toProgram),
		history,
	};
}

/** @param {{workoutSessionId: number, userId: number}} input */
export async function getWorkoutHistoryDetailPageData(input) {
	const [userRow, history] = await Promise.all([
		usersRepository.findById({ userId: input.userId }),
		getWorkoutHistoryDetail(input),
	]);

	return {
		currentUser: userRow ? userMapper.toLoggedUser(userRow) : null,
		history,
	};
}
