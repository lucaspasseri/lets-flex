import * as trainingDaysDb from "../../db/training_days/index.js";
import pool from "../../db/pool.js";
import { addDays, format } from "date-fns";

const setTrainingDayByActiveDay = async (_req, res, next) => {
	const { activeDay, programId } = res.locals.sessionState;

	const trainingDay = activeDay
		? await trainingDaysDb.getTrainingDayByScheduledDateAndProgramId(pool, {
				scheduledDate: activeDay,
				programId,
			})
		: null;

	res.locals.sessionState.trainingDayId = trainingDay?.id ?? null;
	res.locals.appState.currentTrainingDay = trainingDay;

	next();
};

export { setTrainingDayByActiveDay };
