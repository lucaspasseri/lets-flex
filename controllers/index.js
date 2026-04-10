import * as usersDb from "../db/users/index.js";
import * as programsDb from "../db/programs/index.js";
// import * as goalsDb from "../db/goals/index.js";
// import * as cyclesDb from "../db/cycles/index.js";
// import * as sessionsDb from "../db/sessions/index.js";
// import * as sessionStepsDb from "../db/session_steps/index.js";
// import * as stepTypesDb from "../db/step_types/index.js";
// import * as exercisesDb from "../db/exercises/index.js";
// import * as movementPatternsDb from "../db/movement_patterns/index.js";
// import * as musclesDb from "../db/muscles/index.js";
// import * as exerciseMusclesDb from "../db/exercise_muscles/index.js";
// import * as equipmentsDb from "../db/equipments/index.js";
// import * as exerciseVariantsDb from "../db/exercise_variants/index.js";

async function getIndex(_req, res) {
	const userArr = await usersDb.getAllUsers();
	// const goalArr = await goalsDb.getAllGoals();
	// const programArrWithoutIds = await programsDb.getAllProgramsWithoutIds();
	// const cycleArr = await cyclesDb.getAllCyclesWithoutIds();
	// const sessionArr = await sessionsDb.getAllSessionsWithOutIds();
	// const sessionStepArr = await sessionStepsDb.getAllSessionStepsWithJoins();
	// const stepTypeArr = await stepTypesDb.getAllStepTypes();
	// const exerciseArr = await exercisesDb.getAllExercises();
	// const movementPatternArr = await movementPatternsDb.getAllMovementPatterns();
	// const muscleArr = await musclesDb.getAllMuscles();
	// const exerciseMuscleArr =
	// 	await exerciseMusclesDb.getAllExerciseMusclesWithJoins();
	// const equipmentArr = await equipmentsDb.getAllEquipments();
	// const exerciseVariantArr =
	// 	await exerciseVariantsDb.getAllExerciseVariantsWithJoins();

	// const userData = res.locals;

	// if (userArr.length === 0 || res.locals.currentUser === null) {
	// 	res.redirect("/profile");
	// 	return;
	// }

	// const currUserPrograms = await programsDb.getProgramsByUserId(
	// 	Number(res.locals.currentUser.id),
	// );

	res.render("index", {
		title: "Let's Flex!",
		userArr,
		// currUserPrograms,
	});
}

export { getIndex };
