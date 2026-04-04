import { Router } from "express";
import { getIndex } from "../controllers/index.js";
import { getCurrentUser } from "../middlewares/getCurrentUser.js";

const router = Router();

router.get("/", getCurrentUser, getIndex);

export default router;
