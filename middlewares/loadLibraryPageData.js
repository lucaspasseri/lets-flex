import * as equipmentsDb from "../db/equipments/index.js";
import * as movementPatternsDb from "../db/movement_patterns/index.js";
import * as musclesDb from "../db/muscles/index.js";
import * as muscleRolesDb from "../db/muscle_roles/index.js";
import * as exerciseVariantsDb from "../db/exercise_variants/index.js";

const loadLibraryPageData = async (req, res, next) => {
	const [
		equipmentArr,
		movementPatternArr,
		muscleArr,
		muscleRoleArr,
		exerciseVariantArr,
	] = await Promise.all([
		equipmentsDb.getAllEquipments(),
		movementPatternsDb.getAllMovementPatterns(),
		musclesDb.getAllMuscles(),
		muscleRolesDb.getAllMuscleRoles(),
		exerciseVariantsDb.getAllExerciseVariants(),
	]);

	res.locals.data = {
		...res.locals.data,
		equipmentArr,
		movementPatternArr,
		muscleArr,
		muscleRoleArr,
		exerciseVariantArr,
	};

	next();
};

export { loadLibraryPageData };
