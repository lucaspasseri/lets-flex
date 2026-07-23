import toNullableNumber from "../../../utils/toNullableNumber.js";
import * as usersRepository from "../users/repository.js";
import * as trainingDaysRepository from "../trainingDays/repository.js";
import * as sessionsRepository from "../sessions/repository.js";
import * as workoutSessionsRepository from "../workoutSessions/repository.js";
import { toSessionViewModel } from "../../../views/viewModels/toSessionViewModel.js";

export async function getDayPage({ query, sessionState }) {
	const pageState = {
		dayId: toNullableNumber(query?.dayId),
		sessionId: toNullableNumber(query?.sessionId),
	};

	const { programId, userId } = sessionState;

	const [user, day, dayArr, sessionArr, workoutSessionArr] = await Promise.all([
		await usersRepository.findById({ userId }),
		await trainingDaysRepository.findById({ trainingDayId: pageState.dayId }),
		await trainingDaysRepository.findAllByProgramId({ programId }),
		await sessionsRepository.findAll(),
		await workoutSessionsRepository.findAllByTrainingDayId({
			trainingDayId: pageState.dayId,
		}),
	]);

	const shapedWorkoutSessionArr = workoutSessionArr.map(session =>
		toSessionViewModel(session, { type: "workout" }),
	);

	const notCancelledWorkoutSessionArr = shapedWorkoutSessionArr.filter(
		ws => ws.status !== "cancelled",
	);

	const shapedSessionArr = sessionArr.map(session =>
		toSessionViewModel(session, { type: "template" }),
	);

	const notArchivedSessionArr = shapedSessionArr.filter(
		session => session.isArchived === false,
	);

	return {
		pageState,
		appState: { user, day },
		data: {
			days: {
				items: dayArr,
			},
			workoutSessions: {
				items: shapedWorkoutSessionArr,
				notCancelledItems: notCancelledWorkoutSessionArr,
			},
			sessions: {
				items: shapedSessionArr,
				notArchivedItems: notArchivedSessionArr,
			},
		},
	};
}
