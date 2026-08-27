import express from "express";
import { getSessionState } from "../middlewares/getSessionState.js";
import { workoutStepLogController } from "../src/interfaces/controllers/workoutStepLogController.js";
import validateRequestBody from "../middlewares/validateRequestBody.js";
import validateRequestParams from "../middlewares/validateRequestParams.js";
import {
	dashboardStepActionBodySchema,
	performWorkoutStepLogBodySchema,
	workoutStepLogActionParamsSchema,
} from "../src/interfaces/validation/dashboardSchemas.js";

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
