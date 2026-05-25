import express from "express";
import { getSessionState } from "../middlewares/getSessionState.js";
import {
	skipWorkoutStep,
	performWorkoutStep,
} from "../controllers/workout_step_logs.js";

const router = express.Router();

router.post("/:workoutStepLogId/skip", getSessionState, skipWorkoutStep);
router.post("/:workoutStepLogId/perform", getSessionState, performWorkoutStep);

export default router;
