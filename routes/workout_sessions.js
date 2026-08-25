import express from "express";
import { getSessionState } from "../middlewares/getSessionState.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { workoutSessionController } from "../src/interfaces/controllers/workoutSessionController.js";
import validateRequestBody from "../middlewares/validateRequestBody.js";
import {
	cancelWorkoutSessionSchema,
	createWorkoutSessionSchema,
} from "../src/interfaces/validation/daySchemas.js";

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

router.post("/:workoutSessionId/start", workoutSessionController.start);
router.post("/:workoutSessionId/finish", workoutSessionController.finish);
router.patch(
	"/:workoutSessionId",
	validateRequestBody(
		cancelWorkoutSessionSchema,
		workoutSessionController.showCancelErrors,
	),
	workoutSessionController.cancel,
);

export default router;
