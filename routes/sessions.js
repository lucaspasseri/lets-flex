import { Router } from "express";
import { getSessionByCycleId, addNewSession } from "../controllers/sessions.js";

const router = Router();

router.get("/:cycleId", getSessionByCycleId);

router.post("/", addNewSession);

export default router;
