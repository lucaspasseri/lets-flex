import * as usersRepository from "../users/repository.js";
import * as trainingDaysRepository from "../trainingDays/repository.js";
import * as sessionsRepository from "../sessions/repository.js";
import * as workoutSessionsRepository from "../workoutSessions/repository.js";
import * as programsRepository from "../programs/repository.js";
import * as userMapper from "../users/mapper.js";
import * as trainingDayMapper from "../trainingDays/mapper.js";
import * as sessionMapper from "../sessions/mapper.js";
import * as workoutSessionMapper from "../workoutSessions/mapper.js";

/**
 * @typedef {import("./dayPage.types.js").DayPageData} DayPageData
 * @typedef {import("./dayPage.types.js").GetDayPageDataInput} GetDayPageDataInput
 */

/**
 * @param {GetDayPageDataInput} input
 * @returns {Promise<DayPageData>}
 */

async function getDayPageData({ userId, programId, dayId }) {
	const [user, ownedProgram, sessionArr] = await Promise.all([
		usersRepository.findById({ userId }),
		programId && userId
			? programsRepository.findByIdForUser({
					programId,
					userId,
				})
			: Promise.resolve(null),
		sessionsRepository.findVisibleForUser({ userId }),
	]);
	const dayArr = ownedProgram
		? await trainingDaysRepository.findAllByProgramId({ programId: ownedProgram.id })
		: [];

	const days = dayArr.map(trainingDayMapper.toTrainingDay);
	const day = days.find((day) => day.id === dayId) ?? null;
	const workoutSessionArr = day
		? await workoutSessionsRepository.findAllByTrainingDayId({
				trainingDayId: day.id,
			})
		: [];

	return {
		currentUser: user ? userMapper.toLoggedUser(user) : null,
		days: {
			current: day,
			items: days,
		},
		sessions: {
			items: sessionArr.map(sessionMapper.toSessionMapperSeed),
		},
		workoutSessions: {
			items: workoutSessionArr.map(workoutSessionMapper.toWorkoutSession),
		},
	};
}

export default getDayPageData;
