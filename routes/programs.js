import express from "express";
import {
	addNewProgram,
	renderProgramsPage,
	renderDayPage,
} from "../controllers/programs.js";
import { getHelpers } from "../middlewares/getHelpers.js";
import { getCurrentUserFromParams } from "../middlewares/getCurrentUserFromParams.js";
import { getCurrentProgram } from "../middlewares/getCurrentProgram.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getCurrentProgramByParams } from "../middlewares/getCurrentProgramByParams.js";
import { getCurrentCycleByParams } from "../middlewares/getCurrentCycleByParams.js";
import { getCurrentDayByParams } from "../middlewares/getCurrentDayByParams.js";
import { getScheduleDate } from "../middlewares/getScheduleDate.js";
import { getCurrentSessionByParams } from "../middlewares/getCurrentSessionByParams.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { makeCurrentEntity } from "../middlewares/makeCurrentEntity.js";
import pool from "../db/pool.js";
import * as usersDb from "../db/users/index.js";
import * as programsDb from "../db/programs/index.js";
import * as cyclesDb from "../db/cycles/index.js";
import * as sessionsDb from "../db/sessions/index.js";
import { getProgramsPageParams } from "../middlewares/getProgramsPageParams.js";
import { getDayPageParams } from "../middlewares/getDayPageParams.js";
import { makeCurrentValue } from "../middlewares/makeCurrentValue.js";

const router = express.Router();

router.get(
	"/",
	getUrlAndPath,
	getHelpers,
	getSessionState,
	makeCurrentEntity({
		pageParamsKey: "programsPageParams",
		paramKey: "userId",
		sessionKey: "userId",
		appStateKey: "currentUser",
		getById: userId => usersDb.getUserById(pool, { userId }),
	}),

	renderProgramsPage,
);

router.get(
	"/:programId",
	getUrlAndPath,
	getHelpers,
	getSessionState,
	getProgramsPageParams,
	makeCurrentEntity({
		pageParamsKey: "programsPageParams",
		paramKey: "userId",
		sessionKey: "userId",
		appStateKey: "currentUser",
		getById: userId => usersDb.getUserById(pool, { userId }),
	}),
	makeCurrentEntity({
		pageParamsKey: "programsPageParams",
		paramKey: "programId",
		sessionKey: "programId",
		appStateKey: "currentProgram",
		getById: programId => programsDb.getProgramById(pool, { programId }),
	}),
	makeCurrentEntity({
		pageParamsKey: "programsPageParams",
		paramKey: "cycleId",
		sessionKey: "cycleId",
		appStateKey: "currentCycle",
		getById: cycleId => cyclesDb.getCycleById(pool, { cycleId }),
	}),
	(req, res, next) => {
		console.log({ l: res.locals });
		next();
	},
	renderProgramsPage,
);

router.get(
	"/day/:dayId",
	getUrlAndPath,
	getHelpers,
	getSessionState,
	getDayPageParams,
	makeCurrentEntity({
		pageParamsKey: "programsPageParams",
		paramKey: "userId",
		sessionKey: "userId",
		appStateKey: "currentUser",
		getById: userId => usersDb.getUserById(pool, { userId }),
	}),
	makeCurrentEntity({
		pageParamsKey: "programsPageParams",
		paramKey: "programId",
		sessionKey: "programId",
		appStateKey: "currentProgram",
		getById: programId => programsDb.getProgramById(pool, { programId }),
	}),
	makeCurrentEntity({
		pageParamsKey: "programsPageParams",
		paramKey: "cycleId",
		sessionKey: "cycleId",
		appStateKey: "currentCycle",
		getById: cycleId => cyclesDb.getCycleById(pool, { cycleId }),
	}),
	makeCurrentValue({
		pageParamsKey: "dayPageParams",
		paramKey: "dayId",
		sessionKey: "dayId",
		transform: Number,
	}),
	makeCurrentValue({
		pageParamsKey: "dayPageParams",
		paramKey: "sessionId",
		sessionKey: "sessionId",
		transform: Number,
	}),
	(req, res, next) => {
		console.log({ l: res.locals });
		next();
	},
	getScheduleDate,
	renderDayPage,
);

// router.get(
// 	"/:programId/cycles/:cycleId",
// 	getUrlAndPath,
// 	getHelpers,
// 	getSessionState,
// 	makeCurrentEntity({
// 		pageParamsKey: "programsPageParams",
// 		paramKey: "userId",
// 		sessionKey: "userId",
// 		appStateKey: "currentUser",
// 		getById: userId => usersDb.getUserById(pool, { userId }),
// 	}),
// 	getCurrentProgramByParams,
// 	getCurrentCycleByParams,

// 	renderProgramsPage,
// );

// router.get(
// 	"/:programId/cycles/:cycleId/day/:dayId",
// 	getUrlAndPath,
// 	getHelpers,
// 	getSessionState,
// 	makeCurrentEntity({
// 		pageParamsKey: "programsPageParams",
// 		paramKey: "userId",
// 		sessionKey: "userId",
// 		appStateKey: "currentUser",
// 		getById: userId => usersDb.getUserById(pool, { userId }),
// 	}),
// 	getCurrentProgramByParams,
// 	getCurrentCycleByParams,
// 	getCurrentDayByParams,

// 	renderProgramsPage,
// );

// router.get(
// 	"/day/:dayId",
// 	getUrlAndPath,
// 	getHelpers,
// 	getSessionState,
// 	makeCurrentEntity({
// 		pageParamsKey: "programsPageParams",
// 		paramKey: "userId",
// 		sessionKey: "userId",
// 		appStateKey: "currentUser",
// 		getById: userId => usersDb.getUserById(pool, { userId }),
// 	}),
// 	getCurrentProgramByParams,
// 	getCurrentCycleByParams,
// 	getCurrentDayByParams,
// 	getCurrentSessionByParams,

// 	getScheduleDate,
// 	renderDayPage,
// );

// router.get(
// 	"/day/:dayId/sessions/:sessionId",
// 	getUrlAndPath,
// 	getHelpers,
// 	getSessionState,
// 	makeCurrentEntity({
// 		pageParamsKey: "programsPageParams",
// 		paramKey: "userId",
// 		sessionKey: "userId",
// 		appStateKey: "currentUser",
// 		getById: userId => usersDb.getUserById(pool, { userId }),
// 	}),
// 	getCurrentProgramByParams,
// 	getCurrentCycleByParams,
// 	getCurrentDayByParams,
// 	getCurrentSessionByParams,

// 	getScheduleDate,
// 	renderDayPage,
// );

router.post("/", addNewProgram);

export default router;
