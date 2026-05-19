import express from "express";
import { startWorkoutSession } from "../controllers/workout_sessions.js";

const router = express.Router();

router.post("/", startWorkoutSession);

export default router;
