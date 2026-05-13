import { Router } from "express";
import { getIndex } from "../controllers/index.js";

import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getCurrentProgram } from "../middlewares/getCurrentProgram.js";
import { getHelpers } from "../middlewares/getHelpers.js";
import { getDifferenceInCalendarDays } from "../middlewares/getDifferenceInCalendarDays.js";
import { getCurrentSession } from "../middlewares/getCurrentSession.js";
import { getCurrentUserFromParams } from "../middlewares/getCurrentUserFromParams.js";

const router = Router();

router.get(
	"/",
	getUrlAndPath,
	getHelpers,
	getCurrentUserFromParams,
	getCurrentProgram,
	getIndex,
);

router.get(
	"/differenceInCalendarDays/:daysDifference",
	getUrlAndPath,
	getHelpers,
	getCurrentUserFromParams,
	getCurrentProgram,
	getDifferenceInCalendarDays,
	getIndex,
);

router.get(
	"/activeSession/:sessionId",
	getUrlAndPath,
	getHelpers,
	getCurrentUserFromParams,
	getCurrentProgram,
	getCurrentSession,
	getIndex,
);

router.get(
	"/differenceInCalendarDays/:daysDifference/activeSession/:sessionId",
	getUrlAndPath,
	getHelpers,
	getCurrentUserFromParams,
	getCurrentProgram,
	getDifferenceInCalendarDays,
	getCurrentSession,
	getIndex,
);

export default router;
