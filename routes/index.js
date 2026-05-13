import { Router } from "express";
import { getIndex } from "../controllers/index.js";

import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getCurrentProgram } from "../middlewares/getCurrentProgram.js";
import { getHelpers } from "../middlewares/getHelpers.js";
import { getDifferenceInCalendarDays } from "../middlewares/getDifferenceInCalendarDays.js";
import { getCurrentSession } from "../middlewares/getCurrentSession.js";
import { getCurrentUserFromParams } from "../middlewares/getCurrentUserFromParams.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { makeCurrentEntity } from "../middlewares/makeCurrentEntity.js";
import pool from "../db/pool.js";
import * as usersDb from "../db/users/index.js";
import * as programsDb from "../db/programs/index.js";
import { getDashboardPageParams } from "../middlewares/getDashboardPageParams.js";
import { makeCurrentValue } from "../middlewares/makeCurrentValue.js";

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
	getIndex,
);

// router.get(
// 	"/differenceInCalendarDays/:daysDifference",
// 	getUrlAndPath,
// 	getHelpers,
// 	getDashboardPageParams,
// 	getCurrentUserFromParams,
// 	getCurrentProgram,
// 	getDifferenceInCalendarDays,
// 	getIndex,
// );

// router.get(
// 	"/activeSession/:sessionId",
// 	getUrlAndPath,
// 	getHelpers,
// 	getCurrentUserFromParams,
// 	getCurrentProgram,
// 	getCurrentSession,
// 	getIndex,
// );

// router.get(
// 	"/differenceInCalendarDays/:daysDifference/activeSession/:sessionId",
// 	getUrlAndPath,
// 	getHelpers,
// 	getCurrentUserFromParams,
// 	getCurrentProgram,
// 	getDifferenceInCalendarDays,
// 	getCurrentSession,
// 	getIndex,
// );

export default router;
