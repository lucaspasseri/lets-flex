import express from "express";
import { cycleController } from "../controllers/cycleController.js";
import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import { getHelpers } from "../middleware/getHelpers.js";
import { getSessionState } from "../middleware/getSessionState.js";
import validateRequestBody from "../middleware/validateRequestBody.js";
import { createCycleSchema, cycleParamsSchema } from "../validation/programSchemas.js";
import validateRequestParams from "../middleware/validateRequestParams.js";

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
