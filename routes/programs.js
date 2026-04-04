import express from "express";
import { addNewProgram, renderProgramsPage } from "../controllers/programs.js";
import { getCurrentUser } from "../middlewares/getCurrentUser.js";

const router = express.Router();

router.get("/", getCurrentUser, renderProgramsPage);
router.post("/", addNewProgram);

export default router;
