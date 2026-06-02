import * as equipmentsDb from "../db/equipments/index.js";
import * as movementPatternsDb from "../db/movement_patterns/index.js";
import * as musclesDb from "../db/muscles/index.js";
import * as muscleRolesDb from "../db/muscle_roles/index.js";
import * as exerciseVariantsDb from "../db/exercise_variants/index.js";
import * as sessionsDb from "../db/sessions/index.js";
import pool from "../db/pool.js";

const loadLibraryPageData = async (req, res, next) => {
	const [
		equipmentArr,
		movementPatternArr,
		muscleArr,
		muscleRoleArr,
		exerciseVariantArr,
		sessionArr,
	] = await Promise.all([
		equipmentsDb.getAllEquipments(pool),
		movementPatternsDb.getAllMovementPatterns(pool),
		musclesDb.getAllMuscles(pool),
		muscleRolesDb.getAllMuscleRoles(pool),
		exerciseVariantsDb.getAllExerciseVariants(pool),
		sessionsDb.getAllSessions(pool),
	]);

	res.locals.data = {
		...res.locals.data,
		equipmentArr,
		movementPatternArr,
		muscleArr,
		muscleRoleArr,
		exerciseVariantArr,
		sessionArr,
	};

	next();
};

export { loadLibraryPageData };
