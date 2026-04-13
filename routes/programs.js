import express from "express";
import { addNewProgram, renderProgramsPage } from "../controllers/programs.js";
import { getHelpers } from "../middlewares/getHelpers.js";
import { getCurrentUser } from "../middlewares/getCurrentUser.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";

const router = express.Router();

router.get("/", getUrlAndPath, getCurrentUser, getHelpers, renderProgramsPage);
router.post("/", addNewProgram);

export default router;
