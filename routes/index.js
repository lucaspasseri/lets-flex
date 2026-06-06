import { Router } from "express";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getHelpers } from "../middlewares/getHelpers.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { getDashboardPageParams } from "../middlewares/getDashboardPageParams.js";
import { setDashboardPageUserContext } from "../middlewares/setDashboardPageUserContext.js";
import { setDashboardPageProgramContext } from "../middlewares/setDashboardPageProgramContext.js";
import { setDashboardPageDaysDifferenceContext } from "../middlewares/setDashboardPageDaysDifferenceContext.js";
import { setDashboardPageSessionContext } from "../middlewares/setDashboardPageSessionContext.js";
import { loadCycleAndSessionArraysByProgramId } from "../middlewares/loadCycleAndSessionArraysByProgramId.js";
import { loadSessionStepArr } from "../middlewares/loadSessionStepArr.js";
import { setActiveSessionMisc } from "../middlewares/setActiveSessionMisc.js";
import { setActiveWorkoutSession } from "../middlewares/setActiveWorkoutSession.js";
import { loadWorkoutSessionLogArr } from "../middlewares/loadWorkoutSessionLogArr.js";
import { renderDashboardPage } from "../controllers/index.js";
import { setActiveDay } from "../middlewares/setActiveDay.js";
import { setActiveCycle } from "../middlewares/setActiveCycle.js";
import { loadCycleArrByProgramId } from "../middlewares/loadCycleArrByProgramId.js";
import { loadSessionArrByProgramId } from "../middlewares/loadSessionArrByProgramId.js";
import { setTrainingDayByActiveDay } from "../middlewares/setTrainingDayByActiveDay.js";
import { loadWorkoutSessionArrByProgramId } from "../middlewares/loadWorkoutSessionArrByProgramId.js";
import { loadWorkoutSessionArrByTrainingDayId } from "../middlewares/loadWorkoutSessionArrByTrainingDayId.js";
import { setDashboardPageWorkoutSessionContext } from "../middlewares/setDashboardPageWorkoutSessionContext.js";

const router = Router();

router.get(
	"/",
	getUrlAndPath,
	getHelpers,
	getSessionState,
	getDashboardPageParams,
	setDashboardPageUserContext,
	setDashboardPageProgramContext,
	setDashboardPageDaysDifferenceContext,
	setActiveDay,
	setTrainingDayByActiveDay,
	loadCycleArrByProgramId,
	loadWorkoutSessionArrByProgramId,
	loadWorkoutSessionArrByTrainingDayId,
	setDashboardPageWorkoutSessionContext,
	loadSessionStepArr,
	// setActiveWorkoutSession,
	// loadWorkoutSessionLogArr,
	renderDashboardPage,
);

export default router;
