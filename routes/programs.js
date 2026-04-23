import express from "express";
import { addNewProgram, renderProgramsPage } from "../controllers/programs.js";
import { getHelpers } from "../middlewares/getHelpers.js";
import { getCurrentUser } from "../middlewares/getCurrentUser.js";
import { getCurrentProgram } from "../middlewares/getCurrentProgram.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getCurrentProgramByParams } from "../middlewares/getCurrentProgramByParams.js";
import { getCurrentCycleByParams } from "../middlewares/getCurrentCycleByParams.js";
import { getCurrentDayByParams } from "../middlewares/getCurrentDayByParams.js";

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
router.post("/", addNewProgram);

export default router;
