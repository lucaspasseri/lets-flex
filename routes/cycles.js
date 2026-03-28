import express from "express";
import { addNewCycle, getCyclesByProgramId } from "../controllers/cycles.js";

const router = express.Router();

router.get("/:programId", getCyclesByProgramId);

router.post("/", addNewCycle);

export default router;
