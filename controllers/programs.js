import * as programsDb from "../db/programs/index.js";
import * as goalsDb from "../db/goals/index.js";
import * as cyclesDb from "../db/cycles/index.js";
import * as trainingDaysDb from "../db/training_days/index.js";
import * as sessionsDb from "../db/sessions/index.js";
import * as stepTypesDb from "../db/step_types/index.js";
import * as exerciseVariantsDb from "../db/exercise_variants/index.js";
import * as sessionStepsDb from "../db/session_steps/index.js";
import setActiveProgramAfterCreation from "../services/setActiveProgramAfterCreation.js";

import pool from "../db/pool.js";
import toNullableNumber from "../utils/toNullableNumber.js";
import getTrainingDaysByProgramId from "../services/getTrainingDaysByProgramId.js";

async function addNewProgram(req, res) {
	await setActiveProgramAfterCreation(req);

	res.redirect("/programs");
}

async function renderProgramsPage(req, res) {
	res.locals.page = { ...res.locals.page, title: "Let's Flex!" };

	const { userId, programId } = res.locals.sessionState;

	const programArr =
		userId &&
		(await programsDb.getProgramsByUserId(pool, {
			userId,
		}));

	const cycleArr = await cyclesDb.getCyclesByProgramId(pool, {
		programId,
	});

	const trainingDayArr =
		programId &&
		(await getTrainingDaysByProgramId(pool, {
			programId,
		}));

	const goalArr = await goalsDb.getAllGoals();

	res.render("programs", {
		title: "Let's Flex!",
		goalArr,
		programArr,
		cycleArr,
		trainingDayArr,
	});
}

async function renderDayPage(req, res) {
	res.locals.page = { ...res.locals.page, title: "Let's Flex!" };

	const { programId, dayId, sessionId } = res.locals.sessionState;

	console.log({ programId, dayId, sessionId });

	const sessionArr =
		dayId &&
		(await sessionsDb.getSessionByTrainingDayId(pool, {
			trainingDayId: dayId,
		}));

	const stepTypeArr = await stepTypesDb.getAllStepTypes();
	const exerciseVariantArr = await exerciseVariantsDb.getAllExerciseVariants();

	const sessionStepArr =
		sessionId &&
		(await sessionStepsDb.getSessionStepsBySessionId(pool, { sessionId }));

	const trainingDayArr =
		programId &&
		(await getTrainingDaysByProgramId(pool, {
			programId,
		}));

	res.render("day", {
		title: "Let's Flex!",
		sessionArr,
		trainingDayArr,
		stepTypeArr,
		exerciseVariantArr,
		sessionStepArr,
	});
}

export { addNewProgram, renderProgramsPage, renderDayPage };

// const goalArr = await goalsDb.getAllGoals();

// 	const programArr =
// 		res.locals.currentUser &&
// 		(await programsDb.getProgramsByUserId(pool, {
// 			userId: res.locals.currentUser.id,
// 		}));

// 	const cycleArr = await cyclesDb.getCyclesByProgramId(pool, {
// 		programId: currProgramId,
// 	});

// 	const trainingDayArr =
// 		currProgramId &&
// 		(await getTrainingDaysByProgramId(pool, {
// 			programId: currProgramId,
// 		}));

// 	res.render("programs", {
// 		title: "Let's Flex!",
// 		goalArr,
// 		programArr,
// 		cycleArr,
// 		trainingDayArr,
// 		currProgramId: currProgramId,
// 		currCycleId: currCycleId,
// 		currSessionId: currSessionId,
// 		currDayId,
// 	});
