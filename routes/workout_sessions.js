import express from "express";
import {
	finishWorkoutSession,
	createWorkoutSession,
	startWorkoutSession,
	cancelWorkoutSession,
} from "../controllers/workout_sessions.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";

const router = express.Router();

router.use(getUrlAndPath);
router.use(getSessionState);

router.post("/", createWorkoutSession);
router.post("/:workoutSessionId/start", startWorkoutSession);
router.post("/:workoutSessionId/finish", finishWorkoutSession);
router.patch("/:workoutSessionId", cancelWorkoutSession);

export default router;
