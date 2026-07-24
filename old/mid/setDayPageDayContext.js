import pool from "../../db/pool.js";
import * as programsDb from "../../db/programs/index.js";
import * as trainingDaysDb from "../../db/training_days/index.js";

const setDayPageDayContext = async (req, res, next) => {
	let dayId = res.locals.dayPageParams.dayId;

	if (dayId === null) {
		dayId = res.locals.sessionState?.dayId;
	}

	const currentTrainingDay = dayId
		? await trainingDaysDb.getTrainingDayById(pool, { trainingDayId: dayId })
		: null;

	res.locals.appState = { ...res.locals.appState, currentTrainingDay };
	res.locals.sessionState = {
		...res.locals.sessionState,
		dayId: currentTrainingDay?.id ?? null,
	};

	if (currentTrainingDay !== null) {
		req.session.state.dayId = currentTrainingDay?.id;
	}

	next();
};

export { setDayPageDayContext };
