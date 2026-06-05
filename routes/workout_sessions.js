import express from "express";
import {
	finishWorkoutSession,
	createWorkoutSession,
} from "../controllers/workout_sessions.js";
import { getSessionState } from "../middlewares/getSessionState.js";

const router = express.Router();

router.post("/", getSessionState, createWorkoutSession);
router.post("/:workoutSessionId/finish", getSessionState, finishWorkoutSession);

export default router;
