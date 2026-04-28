import * as programsDb from "../db/programs/index.js";
import * as goalsDb from "../db/goals/index.js";
import * as cyclesDb from "../db/cycles/index.js";
import * as sessionsDb from "../db/sessions/index.js";
import * as stepTypesDb from "../db/step_types/index.js";
import * as exerciseVariantsDb from "../db/exercise_variants/index.js";
import * as sessionStepsDb from "../db/session_steps/index.js";
import setActiveProgramAfterCreation from "../services/setActiveProgramAfterCreation.js";
import pool from "../db/pool.js";

async function addNewProgram(req, res) {
	await setActiveProgramAfterCreation(req);

	res.redirect("/programs");
}

async function renderProgramsPage(req, res) {
	const currProgramId = req.session.state?.programId || null;
	const currCycleId = req.session.state?.cycleId || null;
	const currSessionId = req.session.state?.sessionId || null;
	const currDayId = req.session.state?.dayId || null;

	const goalArr = await goalsDb.getAllGoals();

	const programArr =
		res.locals.currentUser &&
		(await programsDb.getProgramsByUserId(pool, {
			userId: res.locals.currentUser.id,
		}));

	const cycleArr = await cyclesDb.getCyclesByProgramId(pool, {
		programId: currProgramId,
	});

	const sessionArr = await sessionsDb.getSessionByCycleId(pool, {
		cycleId: currCycleId,
	});

	const stepTypeArr = await stepTypesDb.getAllStepTypes();
	const exerciseVariantArr = await exerciseVariantsDb.getAllExerciseVariants();
	const stepArr = await sessionStepsDb.getAllSessionStepsWithJoins();

	res.render("programs", {
		title: "Let's Flex!",
		goalArr,
		programArr,
		cycleArr,
		sessionArr,
		currProgramId: Number(currProgramId),
		currCycleId: Number(currCycleId),
		currSessionId: Number(currSessionId),
		stepTypeArr,
		exerciseVariantArr,
		stepArr,
		currDayId,
	});
}

async function renderDayPage(req, res) {
	const { dayId } = req.params;

	res.render("day", {
		title: "Let's Flex!",
		dayId,
	});
}

export { addNewProgram, renderProgramsPage, renderDayPage };
