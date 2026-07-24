import express from "express";
import {
	setCurrentProgram,
	setCurrentUser,
	setCurrentCycle,
	setCurrentSession,
} from "../controllers/app_state.js";
import { getSessionState } from "../../middlewares/getSessionState.js";

const router = express.Router();

router.post("/set_current_user", setCurrentUser);
router.post("/set_current_program", setCurrentProgram);
router.post("/set_current_cycle", setCurrentCycle);
router.post("/set_current_session", setCurrentSession);

export default router;
