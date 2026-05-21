import { Router } from "express";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getHelpers } from "../middlewares/getHelpers.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { getDashboardPageParams } from "../middlewares/getDashboardPageParams.js";
import { setDashboardPageUserContext } from "../middlewares/setDashboardPageUserContext.js";
import { setDashboardPageProgramContext } from "../middlewares/setDashboardPageProgramContext.js";
import { setDashboardPageDaysDifferenceContext } from "../middlewares/setDashboardPageDaysDifferenceContext.js";
import { setDashboardPageSessionContext } from "../middlewares/setDashboardPageSessionContext.js";
import { loadCycleAndSessionArrays } from "../middlewares/loadCycleAndSessionArrays.js";
import { setActiveCycle } from "../middlewares/setActiveCycle.js";
import { loadSessionStepArr } from "../middlewares/loadSessionStepArr.js";
import { setActiveSessionMisc } from "../middlewares/setActiveSessionMisc.js";
import { setActiveWorkoutSession } from "../middlewares/setActiveWorkoutSession.js";
import { loadWorkoutSessionLogArr } from "../middlewares/loadWorkoutSessionLogArr.js";
import { renderDashboardPage } from "../controllers/index.js";

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
	setDashboardPageSessionContext,
	loadCycleAndSessionArrays,
	setActiveCycle,
	setActiveSessionMisc,
	setActiveWorkoutSession,
	loadWorkoutSessionLogArr,
	renderDashboardPage,
);

export default router;
