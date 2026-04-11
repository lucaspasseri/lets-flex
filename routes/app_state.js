import express from "express";
import {
	setCurrentProgram,
	setCurrentUser,
	setCurrentCycle,
	setCurrentSession,
} from "../controllers/app_state.js";

const router = express.Router();

router.post("/set_current_user", setCurrentUser);
router.post("/set_current_program", setCurrentProgram);
router.post("/set_current_cycle", setCurrentCycle);
router.post("/set_current_session", setCurrentSession);

export default router;
