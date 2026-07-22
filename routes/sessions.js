import { Router } from "express";
import { sessionController } from "../src/interfaces/controllers/sessionController.js";

const router = Router();

router.post("/", sessionController.create);
router.patch("/:sessionId", sessionController.archive);

export default router;
