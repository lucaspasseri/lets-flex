import express from "express";
import { getSessionState } from "../middleware/getSessionState.js";
import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import { workoutSessionController } from "../controllers/workoutSessionController.js";
import validateRequestBody from "../middleware/validateRequestBody.js";
import {
	cancelWorkoutSessionSchema,
	createWorkoutSessionSchema,
} from "../validation/daySchemas.js";
import validateRequestParams from "../middleware/validateRequestParams.js";
import {
	dashboardActionBodySchema,
	workoutSessionActionParamsSchema,
} from "../validation/dashboardSchemas.js";

const router = express.Router();

router.use(getUrlAndPath);
router.use(getSessionState);

router.post(
	"/",
	validateRequestBody(
		createWorkoutSessionSchema,
		workoutSessionController.showCreateErrors,
	),
	workoutSessionController.create,
);

router.post(
	"/:workoutSessionId/start",
	validateRequestParams(workoutSessionActionParamsSchema),
	validateRequestBody(
		dashboardActionBodySchema,
		workoutSessionController.showActionErrors,
	),
	workoutSessionController.start,
);
router.post(
	"/:workoutSessionId/finish",
	validateRequestParams(workoutSessionActionParamsSchema),
	validateRequestBody(
		dashboardActionBodySchema,
		workoutSessionController.showActionErrors,
	),
	workoutSessionController.finish,
);
router.patch(
	"/:workoutSessionId",
	validateRequestParams(workoutSessionActionParamsSchema),
	validateRequestBody(
		cancelWorkoutSessionSchema,
		workoutSessionController.showCancelErrors,
	),
	workoutSessionController.cancel,
);

export default router;
