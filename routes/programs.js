import express from "express";
import {
	addNewProgram,
	renderProgramsPage,
	renderDayPage,
} from "../controllers/programs.js";
import { getHelpers } from "../middlewares/getHelpers.js";
import { getCurrentUser } from "../middlewares/getCurrentUser.js";
import { getCurrentProgram } from "../middlewares/getCurrentProgram.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getCurrentProgramByParams } from "../middlewares/getCurrentProgramByParams.js";
import { getCurrentCycleByParams } from "../middlewares/getCurrentCycleByParams.js";
import { getCurrentDayByParams } from "../middlewares/getCurrentDayByParams.js";
import { getScheduleDate } from "../middlewares/getScheduleDate.js";
import { getCurrentSessionByParams } from "../middlewares/getCurrentSessionByParams.js";

const router = express.Router();

router.get(
	"/",
	getUrlAndPath,
	getCurrentUser,
	getCurrentProgram,
	getHelpers,
	renderProgramsPage,
);

router.get(
	"/:programId",
	getUrlAndPath,
	getCurrentUser,
	getCurrentProgramByParams,
	getHelpers,
	renderProgramsPage,
);

router.get(
	"/:programId/cycles/:cycleId",
	getUrlAndPath,
	getCurrentUser,
	getCurrentProgramByParams,
	getCurrentCycleByParams,
	getHelpers,
	renderProgramsPage,
);

router.get(
	"/:programId/cycles/:cycleId/day/:dayId",
	getUrlAndPath,
	getCurrentUser,
	getCurrentProgramByParams,
	getCurrentCycleByParams,
	getCurrentDayByParams,
	getHelpers,
	renderProgramsPage,
);

router.get(
	"/day/:dayId",
	getUrlAndPath,
	getCurrentUser,
	getCurrentProgramByParams,
	getCurrentCycleByParams,
	getCurrentDayByParams,
	getHelpers,
	getScheduleDate,
	renderDayPage,
);

router.get(
	"/day/:dayId/sessions/:sessionId",
	getUrlAndPath,
	getCurrentUser,
	getCurrentProgramByParams,
	getCurrentCycleByParams,
	getCurrentDayByParams,
	getCurrentSessionByParams,
	getHelpers,
	getScheduleDate,
	renderDayPage,
);
router.post("/", addNewProgram);

export default router;
