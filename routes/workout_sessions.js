import express from "express";
import { startWorkoutSession } from "../controllers/workout_sessions.js";
import { getSessionState } from "../middlewares/getSessionState.js";

const router = express.Router();

router.post("/", getSessionState, startWorkoutSession);

export default router;
