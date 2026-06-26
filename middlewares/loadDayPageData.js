import * as sessionsDb from "../db/sessions/index.js";
import * as stepTypesDb from "../db/step_types/index.js";
import * as exerciseVariantsDb from "../db/exercise_variants/index.js";
import * as sessionStepsDb from "../db/session_steps/index.js";
import * as workoutSessionsDb from "../db/workout_sessions/index.js";
import getTrainingDaysByProgramId from "../services/getTrainingDaysByProgramId.js";
import pool from "../db/pool.js";

const loadDayPageData = async (req, res, next) => {
	const { programId, dayId } = res.locals.sessionState;

	const [
		trainingDayArr,
		stepTypeArr,
		exerciseVariantArr,
		sessionArr,
		workoutSessionArr,
	] = await Promise.all([
		programId
			? getTrainingDaysByProgramId(pool, {
					programId,
				})
			: [],
		stepTypesDb.getAllStepTypes(pool),
		exerciseVariantsDb.getAllExerciseVariants(pool),
		sessionsDb.getAllSessions(pool),
		workoutSessionsDb.getWorkoutSessionWithStepsInfoByTrainingDayId(pool, {
			trainingDayId: dayId,
		}),
	]);

	const notArchivedSessionArr = sessionArr.filter(
		session => session.is_archived === false,
	);

	res.locals.data = {
		...res.locals.data,
		trainingDayArr,
		stepTypeArr,
		exerciseVariantArr,
		sessionArr: notArchivedSessionArr,
		workoutSessionArr,
	};

	next();
};

export { loadDayPageData };
