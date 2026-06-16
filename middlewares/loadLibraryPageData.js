import * as equipmentsDb from "../db/equipments/index.js";
import * as movementPatternsDb from "../db/movement_patterns/index.js";
import * as musclesDb from "../db/muscles/index.js";
import * as muscleRolesDb from "../db/muscle_roles/index.js";
import * as sessionsDb from "../db/sessions/index.js";
import * as stepTypesDb from "../db/step_types/index.js";
import * as exerciseVariantsDb from "../db/exercise_variants/index.js";
import pool from "../db/pool.js";
import session from "express-session";
import { toSessionViewModel } from "../views/viewModels/toSessionViewModel.js";

const loadLibraryPageData = async (req, res, next) => {
	const [
		equipmentArr,
		movementPatternArr,
		muscleArr,
		muscleRoleArr,
		exerciseVariantArr,
		sessionArr,
		stepTypeArr,
	] = await Promise.all([
		equipmentsDb.getAllEquipments(pool),
		movementPatternsDb.getAllMovementPatterns(pool),
		musclesDb.getAllMuscles(pool),
		muscleRolesDb.getAllMuscleRoles(pool),
		exerciseVariantsDb.getAllExerciseVariants(pool),
		sessionsDb.getAllSessionsWithExerciseInfo(pool),
		stepTypesDb.getAllStepTypes(),
	]);

	const shapedSessionArr = sessionArr.map(session =>
		toSessionViewModel(session, { type: "template" }),
	);

	res.locals.data = {
		...res.locals.data,
		equipmentArr,
		movementPatternArr,
		muscleArr,
		muscleRoleArr,
		exerciseVariantArr,
		sessionArr: shapedSessionArr,
		stepTypeArr,
	};

	next();
};

export { loadLibraryPageData };
