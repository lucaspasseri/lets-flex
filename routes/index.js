import { Router } from "express";
import { getIndex } from "../controllers/index.js";
import { getCurrentUser } from "../middlewares/getCurrentUser.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getCurrentProgram } from "../middlewares/getCurrentProgram.js";
import { getHelpers } from "../middlewares/getHelpers.js";

const router = Router();

router.get(
	"/",
	getUrlAndPath,
	getHelpers,
	getCurrentUser,
	getCurrentProgram,
	getIndex,
);

export default router;
