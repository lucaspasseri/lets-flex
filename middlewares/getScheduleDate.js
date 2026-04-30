import * as trainingDaysDb from "../db/training_days/index.js";
import pool from "../db/pool.js";
import { addDays } from "date-fns";
import toNullableNumber from "../utils/toNullableNumber.js";

const getScheduleDate = async (req, res, next) => {
	const currCycleId =
		req.session?.state?.cycleId && toNullableNumber(req.session.state.cycleId);
	const currDayId =
		req.session?.state?.dayId && toNullableNumber(req.session.state.dayId);

	const daysArr = await trainingDaysDb.getTrainingDaysByCycleId(pool, {
		cycleId: currCycleId,
	});

	let distance = 0;

	while (distance < daysArr.length) {
		const day = daysArr[distance];

		if (day.id === currDayId) {
			break;
		}

		distance += 1;
	}

	const startDate = res.locals?.currentProgram?.start_date || null;
	const scheduleDate = addDays(startDate, distance);

	res.locals.scheduleDate = scheduleDate;

	next();
};

export { getScheduleDate };
