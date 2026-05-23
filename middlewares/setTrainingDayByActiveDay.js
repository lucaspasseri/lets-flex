import * as trainingDaysDb from "../db/training_days/index.js";
import pool from "../db/pool.js";
import { addDays } from "date-fns";

const setTrainingDayByActiveDay = async (_req, res, next) => {
	const { activeDay } = res.locals.sessionState;

	const trainingDay = activeDay
		? await trainingDaysDb.getTrainingDayByScheduledDate(pool, {
				scheduledDate: activeDay,
			})
		: null;

	res.locals.sessionState.trainingDayId = trainingDay?.id ?? null;
	res.locals.appState.currentTrainingDay = trainingDay;

	next();
};

export { setTrainingDayByActiveDay };
