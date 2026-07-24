import { Router } from "express";
import {
	getSessionStepsById,
	addNewSessionStep,
} from "../controllers/session_steps.js";

const router = Router();

router.get("/:sessionId", getSessionStepsById);
router.post("/", addNewSessionStep);

export default router;
