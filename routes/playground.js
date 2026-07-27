import express from "express";
import { playgroundController } from "../src/interfaces/controllers/playgroundController.js";

const router = express.Router();

router.get(["/", "/:component"], playgroundController.show);

export default router;
