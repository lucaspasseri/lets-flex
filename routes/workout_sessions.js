import express from "express";
import {
	finishWorkoutSession,
	startWorkoutSession,
} from "../controllers/workout_sessions.js";
import { getSessionState } from "../middlewares/getSessionState.js";

const router = express.Router();

router.post("/", getSessionState, startWorkoutSession);
router.post("/:workoutSessionId/finish", getSessionState, finishWorkoutSession);

export default router;
