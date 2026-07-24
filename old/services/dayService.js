import pool from "../db/pool.js";
import * as usersDb from "../db/users/index.js";
import * as trainingDaysDb from "../db/training_days/index.js";
import * as workoutSessionsDb from "../db/workout_sessions/index.js";
import * as sessionsDb from "../db/sessions/index.js";
import { toSessionViewModel } from "../views/viewModels/toSessionViewModel.js";

import toNullableNumber from "../utils/toNullableNumber.js";

async function getDayPage({ query, sessionState }) {
	const pageState = {
		dayId: toNullableNumber(query?.dayId),
		sessionId: toNullableNumber(query?.sessionId),
	};

	const { programId, userId } = sessionState;

	const [user, day, dayArr, sessionArr, workoutSessionArr] = await Promise.all([
		await usersDb.getUserById(pool, { userId }),
		await trainingDaysDb.getTrainingDayById(pool, {
			trainingDayId: pageState.dayId,
		}),
		await trainingDaysDb.getTrainingDaysByProgramId(pool, { programId }),
		await sessionsDb.getAllSessionsWithExerciseInfo(pool),
		await workoutSessionsDb.getWorkoutSessionWithStepsInfoByTrainingDayId(
			pool,
			{
				trainingDayId: pageState.dayId,
			},
		),
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

export { getDayPage };
