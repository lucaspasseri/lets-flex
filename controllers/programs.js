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
import { da } from "date-fns/locale";
import toNullableNumber from "../utils/toNullableNumber.js";
import getTrainingDaysByProgramId from "../services/getTrainingDaysByProgramId.js";

async function addNewProgram(req, res) {
	await setActiveProgramAfterCreation(req);

	res.redirect("/programs");
}

async function renderProgramsPage(req, res) {
	const currProgramId =
		(req.session.state?.programId && Number(req.session.state.programId)) ||
		null;
	const currCycleId =
		(req.session.state?.cycleId && Number(req.session.state.cycleId)) || null;
	const currSessionId =
		(req.session.state?.sessionId && Number(req.session.state.sessionId)) ||
		null;
	const currDayId =
		(req.session.state?.dayId && Number(req.session.state.dayId)) || null;

	const goalArr = await goalsDb.getAllGoals();

	const programArr =
		res.locals.currentUser &&
		(await programsDb.getProgramsByUserId(pool, {
			userId: res.locals.currentUser.id,
		}));

	const cycleArr = await cyclesDb.getCyclesByProgramId(pool, {
		programId: currProgramId,
	});

	const trainingDayArr =
		currProgramId &&
		(await getTrainingDaysByProgramId(pool, {
			programId: currProgramId,
		}));

	res.render("programs", {
		title: "Let's Flex!",
		goalArr,
		programArr,
		cycleArr,
		trainingDayArr,
		currProgramId: currProgramId,
		currCycleId: currCycleId,
		currSessionId: currSessionId,
		currDayId,
	});
}

async function renderDayPage(req, res) {
	const currProgramId =
		(req.session.state?.programId && Number(req.session.state.programId)) ||
		null;
	const currDayId =
		req.session?.state?.dayId && toNullableNumber(req.session.state.dayId);

	const currSessionId =
		(req.session.state?.sessionId && Number(req.session.state.sessionId)) ||
		null;

	const sessionArr =
		currDayId &&
		(await sessionsDb.getSessionByTrainingDayId(pool, {
			trainingDayId: currDayId,
		}));

	const stepTypeArr = await stepTypesDb.getAllStepTypes();
	const exerciseVariantArr = await exerciseVariantsDb.getAllExerciseVariants();

	const sessionStepArr =
		currSessionId &&
		(await sessionStepsDb.getSessionStepsBySessionId(currSessionId));

	const trainingDayArr =
		currProgramId &&
		(await getTrainingDaysByProgramId(pool, {
			programId: currProgramId,
		}));

	res.render("day", {
		title: "Let's Flex!",
		currDayId,
		sessionArr,
		trainingDayArr,
		currSessionId,
		stepTypeArr,
		exerciseVariantArr,
		sessionStepArr,
	});
}

export { addNewProgram, renderProgramsPage, renderDayPage };
