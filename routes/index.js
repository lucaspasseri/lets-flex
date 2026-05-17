import { Router } from "express";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getHelpers } from "../middlewares/getHelpers.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { getDashboardPageParams } from "../middlewares/getDashboardPageParams.js";
import { makeCurrentEntity } from "../middlewares/makeCurrentEntity.js";
import { makeCurrentValue } from "../middlewares/makeCurrentValue.js";
import pool from "../db/pool.js";
import * as usersDb from "../db/users/index.js";
import * as programsDb from "../db/programs/index.js";
import { loadSessionStepArr } from "../middlewares/loadSessionStepArr.js";
import { setActiveCycle } from "../middlewares/setActiveCycle.js";
import { renderDashboardPage } from "../controllers/index.js";
import { setActiveSessionMisc } from "../middlewares/setActiveSessionMisc.js";
import { loadCycleAndSessionArrays } from "../middlewares/loadCycleAndSessionArrays.js";

const router = Router();

router.get(
	"/",
	getUrlAndPath,
	getHelpers,
	getSessionState,
	getDashboardPageParams,
	makeCurrentEntity({
		pageParamsKey: "dashboardPageParams",
		paramKey: "userId",
		sessionKey: "userId",
		appStateKey: "currentUser",
		getById: userId => usersDb.getUserById(pool, { userId }),
	}),
	makeCurrentEntity({
		pageParamsKey: "dashboardPageParams",
		paramKey: "programId",
		sessionKey: "programId",
		appStateKey: "currentProgram",
		getById: programId => programsDb.getProgramById(pool, { programId }),
	}),
	makeCurrentValue({
		pageParamsKey: "dashboardPageParams",
		paramKey: "daysDifference",
		sessionKey: "daysDifference",
		transform: Number,
	}),
	makeCurrentValue({
		pageParamsKey: "dashboardPageParams",
		paramKey: "sessionId",
		sessionKey: "sessionId",
		transform: Number,
	}),
	loadCycleAndSessionArrays,
	setActiveCycle,
	setActiveSessionMisc,
	loadSessionStepArr,
	renderDashboardPage,
);

export default router;
