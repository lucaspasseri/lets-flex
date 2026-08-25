import express from "express";
import { cycleController } from "../src/interfaces/controllers/cycleController.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getHelpers } from "../middlewares/getHelpers.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import validateRequestBody from "../middlewares/validateRequestBody.js";
import { createCycleSchema } from "../src/interfaces/validation/programSchemas.js";

const router = express.Router();

router.use(getUrlAndPath);
router.use(getHelpers);
router.use(getSessionState);

// router.get("/:programId", getCyclesByProgramId);

router.post(
	"/",
	validateRequestBody(createCycleSchema, cycleController.showCreateErrors),
	cycleController.create,
);

router.delete("/:cycleId", cycleController.delete);

export default router;
