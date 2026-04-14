import * as equipmentsDb from "../db/equipments/index.js";
import * as movementPatternsDb from "../db/movement_patterns/index.js";
import * as musclesDb from "../db/muscles/index.js";
import * as muscleRolesDb from "../db/muscle_roles/index.js";
import * as exerciseVariantsDb from "../db/exercise_variants/index.js";

async function renderLibraryPage(_req, res) {
	const equipmentArr = await equipmentsDb.getAllEquipments();
	const movementPatternArr = await movementPatternsDb.getAllMovementPatterns();
	const muscleArr = await musclesDb.getAllMuscles();
	const muscleRoleArr = await muscleRolesDb.getAllMuscleRoles();
	const exerciseVariantArr = await exerciseVariantsDb.getAllExerciseVariants();

	res.render("library", {
		title: "Let's Flex!",
		equipmentArr,
		movementPatternArr,
		muscleArr,
		muscleRoleArr,
		exerciseVariantArr,
	});
}

export { renderLibraryPage };
