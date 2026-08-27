import express from "express";
import { cycleController } from "../src/interfaces/controllers/cycleController.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getHelpers } from "../middlewares/getHelpers.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import validateRequestBody from "../middlewares/validateRequestBody.js";
import {
	createCycleSchema,
	cycleParamsSchema,
} from "../src/interfaces/validation/programSchemas.js";
import validateRequestParams from "../middlewares/validateRequestParams.js";

const router = express.Router();

router.use(getUrlAndPath);
router.use(getHelpers);
router.use(getSessionState);

router.post(
	"/",
	validateRequestBody(createCycleSchema, cycleController.showCreateErrors),
	cycleController.create,
);

router.delete(
	"/:cycleId",
	validateRequestParams(cycleParamsSchema),
	cycleController.delete,
);

export default router;
