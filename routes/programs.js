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

const router = express.Router();

router.get(
	"/",
	getUrlAndPath,
	getCurrentUserFromParams,
	getCurrentProgram,
	getHelpers,
	renderProgramsPage,
);

router.get(
	"/:programId",
	getUrlAndPath,
	getCurrentUserFromParams,
	getCurrentProgramByParams,
	getHelpers,
	renderProgramsPage,
);

router.get(
	"/:programId/cycles/:cycleId",
	getUrlAndPath,
	getCurrentUserFromParams,
	getCurrentProgramByParams,
	getCurrentCycleByParams,
	getHelpers,
	renderProgramsPage,
);

router.get(
	"/:programId/cycles/:cycleId/day/:dayId",
	getUrlAndPath,
	getCurrentUserFromParams,
	getCurrentProgramByParams,
	getCurrentCycleByParams,
	getCurrentDayByParams,
	getHelpers,
	renderProgramsPage,
);

router.get(
	"/day/:dayId",
	getUrlAndPath,
	getCurrentUserFromParams,
	getCurrentProgramByParams,
	getCurrentCycleByParams,
	getCurrentDayByParams,
	getCurrentSessionByParams,
	getHelpers,
	getScheduleDate,
	renderDayPage,
);

router.get(
	"/day/:dayId/sessions/:sessionId",
	getUrlAndPath,
	getCurrentUserFromParams,
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
