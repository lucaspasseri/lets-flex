import * as usersRepository from "../users/repository.js";
import * as trainingDaysRepository from "../trainingDays/repository.js";
import * as sessionsRepository from "../sessions/repository.js";
import * as workoutSessionsRepository from "../workoutSessions/repository.js";
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
	const [user, dayArr, sessionArr, workoutSessionArr] = await Promise.all([
		usersRepository.findById({ userId }),
		programId
			? trainingDaysRepository.findAllByProgramId({ programId })
			: Promise.resolve([]),
		sessionsRepository.findAll(),
		dayId
			? workoutSessionsRepository.findAllByTrainingDayId({
					trainingDayId: dayId,
				})
			: Promise.resolve([]),
	]);

	const days = dayArr.map(trainingDayMapper.toTrainingDay);
	const day = days.find((day) => day.id === dayId) ?? null;

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
