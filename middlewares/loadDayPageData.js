import * as sessionsDb from "../db/sessions/index.js";
import * as stepTypesDb from "../db/step_types/index.js";
import * as exerciseVariantsDb from "../db/exercise_variants/index.js";
import * as sessionStepsDb from "../db/session_steps/index.js";
import getTrainingDaysByProgramId from "../services/getTrainingDaysByProgramId.js";
import pool from "../db/pool.js";

const loadDayPageData = async (req, res, next) => {
	const { programId, dayId, sessionId } = res.locals.sessionState;

	const [
		trainingDayArr,
		sessionArr,
		stepTypeArr,
		exerciseVariantArr,
		sessionStepArr,
	] = await Promise.all([
		programId
			? getTrainingDaysByProgramId(pool, {
					programId,
				})
			: [],
		dayId
			? sessionsDb.getSessionByTrainingDayId(pool, {
					trainingDayId: dayId,
				})
			: [],
		stepTypesDb.getAllStepTypes(),
		exerciseVariantsDb.getAllExerciseVariants(),
		sessionId
			? sessionStepsDb.getSessionStepsBySessionId(pool, { sessionId })
			: [],
	]);

	res.locals.data = {
		...res.locals.data,
		trainingDayArr,
		sessionArr,
		stepTypeArr,
		exerciseVariantArr,
		sessionStepArr,
	};

	next();
};

export { loadDayPageData };
