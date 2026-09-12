import * as usersRepository from "../users/repository.js";
import * as trainingDaysRepository from "../trainingDays/repository.js";
import * as sessionsRepository from "../sessions/repository.js";
import * as workoutSessionsRepository from "../workoutSessions/repository.js";
import * as userMapper from "../users/mapper.js";
import * as trainingDayMapper from "../trainingDays/mapper.js";
import * as sessionMapper from "../sessions/mapper.js";
import * as workoutSessionMapper from "../workoutSessions/mapper.js";
import getOwnedTrainingDayContext from "./getOwnedTrainingDayContext.js";

/**
 * @typedef {import("./dayPage.types.js").DayPageData} DayPageData
 * @typedef {import("./dayPage.types.js").GetDayPageDataInput} GetDayPageDataInput
 */

/**
 * @param {GetDayPageDataInput & {locale?: string}} input
 * @returns {Promise<DayPageData>}
 */

async function getDayPageData({ userId, dayId, locale }) {
	const [user, context, sessionArr] = await Promise.all([
		usersRepository.findById({ userId }),
		getOwnedTrainingDayContext({ userId, dayId }),
		sessionsRepository.findVisibleForUser({ userId, locale }),
	]);
	const dayArr = context
		? await trainingDaysRepository.findAllByProgramId({
				programId: context.program.id,
			})
		: [];

	const days = dayArr.map(trainingDayMapper.toTrainingDay);
	const day = context?.day ?? null;
	const workoutSessionArr = day
		? await workoutSessionsRepository.findAllByTrainingDayId({
				trainingDayId: day.id,
				locale,
			})
		: [];

	return {
		currentUser: user ? userMapper.toLoggedUser(user) : null,
		program: context?.program ?? null,
		cycle: context?.cycle ?? null,
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
