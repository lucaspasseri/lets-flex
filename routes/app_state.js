import express from "express";
import {
	setCurrentProgram,
	setCurrentUser,
	setCurrentCycle,
} from "../controllers/app_state.js";

const router = express.Router();

router.post("/set_current_user", setCurrentUser);
router.post("/set_current_program", setCurrentProgram);
router.post("/set_current_cycle", setCurrentCycle);

export default router;
