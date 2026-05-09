import * as cyclesDb from "../db/cycles/index.js";
import pool from "../db/pool.js";

// import * as programsDb from "../db/programs/index.js";
// import * as goalsDb from "../db/goals/index.js";

// import * as sessionsDb from "../db/sessions/index.js";
// import * as sessionStepsDb from "../db/session_steps/index.js";
// import * as stepTypesDb from "../db/step_types/index.js";
// import * as exercisesDb from "../db/exercises/index.js";
// import * as movementPatternsDb from "../db/movement_patterns/index.js";
// import * as musclesDb from "../db/muscles/index.js";
// import * as exerciseMusclesDb from "../db/exercise_muscles/index.js";
// import * as equipmentsDb from "../db/equipments/index.js";
// import * as exerciseVariantsDb from "../db/exercise_variants/index.js";

async function getIndex(req, res) {
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

	const currProgramId =
		(req.session.state?.programId && Number(req.session.state.programId)) ||
		null;

	const cycleArr = await cyclesDb.getCyclesByProgramId(pool, {
		programId: currProgramId,
	});

	const currProgramStartDate =
		res.locals?.currentProgram && res.locals.currentProgram.start_date;

	const currDay = new Date();

	const getActiveCycleId = (startDate, currDay, cycleArr) => {
		if (res.locals.differenceInCalendarDays(currDay, startDate) < 0) {
			return null;
		}

		let lastDate = startDate;
		for (let i = 0; i < cycleArr.length; i++) {
			const { id, cycle_size } = cycleArr[i];

			if (
				res.locals.differenceInCalendarDays(
					res.locals.addDays(lastDate, cycle_size),
					currDay,
				) > 0
			) {
				return id;
			}

			lastDate = res.locals.addDays(lastDate, cycle_size);
		}

		return null;
	};

	let activeCycleId;

	if (
		currProgramId !== null ||
		currProgramStartDate !== null ||
		cycleArr.length > 0
	) {
		activeCycleId = getActiveCycleId(currProgramStartDate, currDay, cycleArr);
	}

	res.render("index", {
		title: "Let's Flex!",
		cycleArr,

		activeCycleId,
	});
}

export { getIndex };
