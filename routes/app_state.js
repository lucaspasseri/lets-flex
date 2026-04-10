import express from "express";
import { setCurrentProgram, setCurrentUser } from "../controllers/app_state.js";
import { getCurrentUser } from "../middlewares/getCurrentUser.js";

const router = express.Router();

router.post("/set_current_user", setCurrentUser);
router.post("/set_current_program", setCurrentProgram);

export default router;
