import { Router } from "express";
import {
	getSessionByTrainingDayId,
	addNewSession,
} from "../controllers/sessions.js";

const router = Router();

router.get("/:dayId", getSessionByTrainingDayId);

router.post("/", addNewSession);

export default router;
