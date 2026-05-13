import * as trainingDaysDb from "../db/training_days/index.js";
import pool from "../db/pool.js";
import { addDays } from "date-fns";
import toNullableNumber from "../utils/toNullableNumber.js";
import getTrainingDaysByProgramId from "../services/getTrainingDaysByProgramId.js";

const getScheduledDate = async (req, res, next) => {
	const { programId, cycleId, dayId } = res.locals.sessionState;
	const { currentProgram } = res.locals.appState;

	const dayArr =
		(programId &&
			(await getTrainingDaysByProgramId(pool, {
				programId,
			}))) ??
		[];

	const calculeDate = (startDate, dayArr, dayId) => {
		let distance = 0;

		while (distance < dayArr.length) {
			const day = dayArr[distance];

			if (day.training_day_id === dayId) {
				break;
			}

			distance += 1;
		}
		const scheduleDate = addDays(startDate, distance);
		return scheduleDate;
	};

	const startDate = currentProgram ? currentProgram.start_date : null;

	res.locals.appState.scheduledDate = calculeDate(startDate, dayArr, dayId);
	next();
};

export { getScheduledDate };
