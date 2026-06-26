import express from "express";
import {
	addNewProgram,
	renderProgramsPage,
	renderDayPage,
} from "../controllers/programs.js";

import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getHelpers } from "../middlewares/getHelpers.js";
import { getSessionState } from "../middlewares/getSessionState.js";

import { getDayPageParams } from "../middlewares/getDayPageParams.js";
import { setDayPageUserContext } from "../middlewares/setDayPageUserContext.js";
import { setDayPageProgramContext } from "../middlewares/setDayPageProgramContext.js";
import { setDayPageCycleContext } from "../middlewares/setDayPageCycleContext.js";
import { setDayPageDayContext } from "../middlewares/setDayPageDayContext.js";
import { setDayPageSessionContext } from "../middlewares/setDayPageSessionContext.js";
import { loadDayPageData } from "../middlewares/loadDayPageData.js";
import { programsController } from "../controllers/programsController.js";

const router = express.Router();

router.use(getUrlAndPath);
router.use(getHelpers);
router.use(getSessionState);

router.post("/", addNewProgram);

router.get("/", programsController.show);

router.get(
	"/day",
	getUrlAndPath,
	getHelpers,
	getSessionState,
	getDayPageParams,
	setDayPageUserContext,
	setDayPageProgramContext,
	setDayPageCycleContext,
	setDayPageSessionContext,
	setDayPageDayContext,
	loadDayPageData,
	renderDayPage,
);

export default router;
