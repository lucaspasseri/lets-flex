import pool from "../db/pool.js";
import * as usersDb from "../db/users/index.js";
import * as programsDb from "../db/programs/index.js";
import * as trainingDaysDb from "../db/training_days/index.js";
import * as cyclesDb from "../db/cycles/index.js";
import * as workoutSessionsDb from "../db/workout_sessions/index.js";
import toNullableNumber from "../utils/toNullableNumber.js";
import { addDays } from "date-fns";
import { getHeatmapArr } from "./getHeatmapArr.js";
import { getBarChartData } from "./getBarChartData.js";

async function getData({ userId, programId, daysDifference }) {
	userId = toNullableNumber(userId);
	programId = toNullableNumber(programId);
	daysDifference = toNullableNumber(daysDifference);

	const currDay = new Date();
	const day =
		daysDifference === null ? currDay : addDays(currDay, daysDifference);

	const [user, program, trainingDay, cycleArr, workoutSessionArr] =
		await Promise.all([
			usersDb.getUserById(pool, { userId }),
			programsDb.getProgramById(pool, { programId }),
			trainingDaysDb.getTrainingDayByScheduledDateAndProgramId(pool, {
				scheduledDate: day,
				programId,
			}),
			cyclesDb.getCyclesByProgramId(pool, {
				programId,
			}),
			workoutSessionsDb.getWorkoutSessionByProgramId(pool, {
				programId,
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

	const startDate = program?.start_date ?? null;
	const heatmapArr = getHeatmapArr(startDate, cycleArr, workoutSessionArr);

	const barChart = getBarChartData(startDate, cycleArr, workoutSessionArr);

	return {
		user,
		program,
		day,
		trainingDay,
		cycleArr,
		workoutSessionArr,
		workoutSessionArrByTrainingDay,
		heatmapArr,
		barChart,
	};
}

export { getData };
