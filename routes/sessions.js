import { Router } from "express";
import {
	getSessionByTrainingDayId,
	addNewSession,
	archiveSession,
} from "../controllers/sessions.js";

const router = Router();

router.get("/:dayId", getSessionByTrainingDayId);

router.post("/", addNewSession);
router.patch("/:sessionId", archiveSession);

export default router;
