import * as trainingDaysDb from "../db/training_days/index.js";
import pool from "../db/pool.js";
import { addDays } from "date-fns";
import toNullableNumber from "../utils/toNullableNumber.js";
import getTrainingDaysByProgramId from "../services/getTrainingDaysByProgramId.js";

const getScheduleDate = async (req, res, next) => {
	const currProgramId =
		req.session?.state?.programId &&
		toNullableNumber(req.session.state.programId);
	const currCycleId =
		req.session?.state?.cycleId && toNullableNumber(req.session.state.cycleId);
	const currDayId =
		req.session?.state?.dayId && toNullableNumber(req.session.state.dayId);

	const daysArr = await getTrainingDaysByProgramId(pool, {
		programId: currProgramId,
	});

	let distance = 0;

	while (distance < daysArr.length) {
		const day = daysArr[distance];

		if (day.training_day_id === currDayId) {
			break;
		}

		distance += 1;
	}

	const startDate = res.locals?.currentProgram?.start_date || null;
	const scheduleDate = addDays(startDate, distance);
	console.log({ startDate, scheduleDate });

	res.locals.scheduleDate = scheduleDate;

	next();
};

export { getScheduleDate };
