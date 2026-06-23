import express from "express";
import {
	finishWorkoutSession,
	createWorkoutSession,
	startWorkoutSession,
	cancelWorkoutSession,
} from "../controllers/workout_sessions.js";
import { getSessionState } from "../middlewares/getSessionState.js";

const router = express.Router();

router.post("/", getSessionState, createWorkoutSession);
router.post("/:workoutSessionId/start", startWorkoutSession);
router.post("/:workoutSessionId/finish", finishWorkoutSession);
router.patch("/:workoutSessionId", cancelWorkoutSession);

export default router;
