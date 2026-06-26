import pool from "../db/pool.js";
import * as usersDb from "../db/users/index.js";
import * as programsDb from "../db/programs/index.js";
import * as trainingDaysDb from "../db/training_days/index.js";
import * as cyclesDb from "../db/cycles/index.js";
import * as workoutSessionsDb from "../db/workout_sessions/index.js";
import toNullableNumber from "../utils/toNullableNumber.js";
import { addDays } from "date-fns";
import { toSessionViewModel } from "../views/viewModels/toSessionViewModel.js";

async function getDashboardPage({ query, sessionState }) {
	const { daysDifference, workoutSessionId } = query;
	const pageState = { daysDifference: toNullableNumber(daysDifference) };

	const { userId, programId } = sessionState;

	const currDay = new Date();
	const day =
		pageState.daysDifference === null
			? currDay
			: addDays(currDay, pageState.daysDifference);

	const [user, program, trainingDay, cycleArr, workoutSessionArr] =
		await Promise.all([
			usersDb.getUserById(pool, { userId }),
			programsDb.getProgramById(pool, { programId }),
			trainingDaysDb.getTrainingDayByScheduledDateAndProgramId(pool, {
				scheduledDate: day,
				programId: programId,
			}),
			cyclesDb.getCyclesByProgramId(pool, {
				programId: programId,
			}),
			workoutSessionsDb.getWorkoutSessionByProgramId(pool, {
				programId: programId,
			}),
		]);

	const workoutSessionArrByTrainingDay = trainingDay?.id
		? await workoutSessionsDb.getWorkoutSessionWithStepsInfoByTrainingDayId(
				pool,
				{
					trainingDayId: trainingDay.id,
				},
			)
		: [];

	const shapedWorkoutSessionArrByTrainingDay =
		workoutSessionArrByTrainingDay.map(ws =>
			toSessionViewModel(ws, { type: "workout" }),
		);

	let workoutSession = workoutSessionId
		? await workoutSessionsDb.getWorkoutSessionWithStepsInfoByWorkoutSessionId(
				pool,
				{ workoutSessionId },
			)
		: null;

	if (workoutSession === null) {
		workoutSession = workoutSessionArrByTrainingDay?.[0]
			? toSessionViewModel(workoutSessionArrByTrainingDay[0], {
					type: "workout",
				})
			: null;
	}

	const shapedWorkoutSession = workoutSession
		? toSessionViewModel(workoutSession, {
				type: "workout",
			})
		: null;

	return {
		pageState,
		appState: {
			user,
			program,
			day,
			trainingDay,
			workoutSession: shapedWorkoutSession,
		},
		data: {
			cycles: {
				items: cycleArr,
			},
			workoutSessions: {
				items: workoutSessionArr,
				itemsByTrainingDay: shapedWorkoutSessionArrByTrainingDay,
			},
		},
	};
}

export { getDashboardPage };
