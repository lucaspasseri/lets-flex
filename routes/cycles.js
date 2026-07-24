import express from "express";
import { cycleController } from "../src/interfaces/controllers/cycleController.js";

const router = express.Router();

// router.get("/:programId", getCyclesByProgramId);

router.post("/", cycleController.create);

export default router;
