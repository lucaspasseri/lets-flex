import * as usersRepository from "../users/repository.js";
import * as trainingDaysRepository from "../trainingDays/repository.js";
import * as sessionsRepository from "../sessions/repository.js";
import * as workoutSessionsRepository from "../workoutSessions/repository.js";

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
		await usersRepository.findById({ userId }),
		programId
			? await trainingDaysRepository.findAllByProgramId({ programId })
			: Promise.resolve([]),
		await sessionsRepository.findAll(),
		dayId
			? await workoutSessionsRepository.findAllByTrainingDayId({
					trainingDayId: dayId,
				})
			: Promise.resolve([]),
	]);

	const day = dayArr.filter(day => day.id === dayId)?.[0];

	return {
		users: {
			current: user,
		},
		days: {
			current: day,
			items: dayArr,
		},
		sessions: {
			items: sessionArr,
		},
		workoutSessions: {
			items: workoutSessionArr,
		},
	};
}

export default getDayPageData;
