import express from "express";
import {
	finishWorkoutSession,
	createWorkoutSession,
	startWorkoutSession,
	cancelWorkoutSession,
} from "../controllers/workout_sessions.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { workoutSessionController } from "../src/interfaces/controllers/workoutSessionController.js";

const router = express.Router();

router.use(getUrlAndPath);
router.use(getSessionState);

router.post("/", workoutSessionController.create);

// router.post("/:workoutSessionId/start", startWorkoutSession);
router.post("/:workoutSessionId/start", workoutSessionController.start);
// router.post("/:workoutSessionId/finish", finishWorkoutSession);
router.post("/:workoutSessionId/finish", workoutSessionController.finish);

router.patch("/:workoutSessionId", workoutSessionController.cancel);

export default router;
