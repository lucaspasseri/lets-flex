import express from "express";
import { getSessionState } from "../middleware/getSessionState.js";
import { workoutStepLogController } from "../controllers/workoutStepLogController.js";
import validateRequestBody from "../middleware/validateRequestBody.js";
import validateRequestParams from "../middleware/validateRequestParams.js";
import {
	dashboardStepActionBodySchema,
	performWorkoutStepLogBodySchema,
	workoutStepLogActionParamsSchema,
} from "../validation/dashboardSchemas.js";

const router = express.Router();

router.post(
	"/:workoutStepLogId/skip",
	getSessionState,
	validateRequestParams(workoutStepLogActionParamsSchema),
	validateRequestBody(
		dashboardStepActionBodySchema,
		workoutStepLogController.showActionErrors,
	),
	workoutStepLogController.skip,
);

router.post(
	"/:workoutStepLogId/perform",
	getSessionState,
	validateRequestParams(workoutStepLogActionParamsSchema),
	validateRequestBody(
		performWorkoutStepLogBodySchema,
		workoutStepLogController.showPerformErrors,
	),
	workoutStepLogController.perform,
);

export default router;
