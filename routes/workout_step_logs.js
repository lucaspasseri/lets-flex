import express from "express";
import { getSessionState } from "../middlewares/getSessionState.js";
import {
	skipWorkoutStep,
	performWorkoutStep,
} from "../controllers/workout_step_logs.js";
import { workoutStepLogController } from "../controllers/workoutStepLogController.js";

const router = express.Router();

router.post(
	"/:workoutStepLogId/skip",
	getSessionState,
	workoutStepLogController.skip,
);

router.post(
	"/:workoutStepLogId/perform",
	getSessionState,
	workoutStepLogController.perform,
);

export default router;
