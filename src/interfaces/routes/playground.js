import express from "express";
import { playgroundController } from "../controllers/playgroundController.js";

const router = express.Router();

router.get(["/", "/:component"], playgroundController.show);

export default router;
