import pool from "../../../db/pool.js";
import toNullableNumber from "../../../utils/toNullableNumber.js";
import { addDays } from "date-fns";
import getHeatmapArr from "./getHeatmapArr.js";
import getBarChartData from "./getBarChartData.js";
import * as usersRepository from "../users/repository.js";
import * as programsRepository from "../programs/repository.js";
import * as trainingDaysRepository from "../trainingDays/repository.js";
import * as cyclesRepository from "../cycles/repository.js";
import * as workoutSessionsRepository from "../workoutSessions/repository.js";

async function dataLoader({ userId, programId, daysDifference }) {
	userId = toNullableNumber(userId);
	programId = toNullableNumber(programId);
	daysDifference = toNullableNumber(daysDifference);

	const currDay = new Date();
	const day =
		daysDifference === null ? currDay : addDays(currDay, daysDifference);

	const [user, program, trainingDay, cycleArr, workoutSessionArr] =
		await Promise.all([
			usersRepository.findById({ userId }),
			programsRepository.findById({ programId }),
			trainingDaysRepository.findByProgramIdAndScheduledDate({
				programId,
				scheduledDate: day,
			}),
			cyclesRepository.findAllByProgramId({ programId }),
			workoutSessionsRepository.findAllByProgramId({ programId }),
		]);

	const workoutSessionArrByTrainingDay = trainingDay?.id
		? await workoutSessionsRepository.findAllByTrainingDayId({
				trainingDayId: trainingDay?.id,
			})
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

export default dataLoader;
