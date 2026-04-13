import { Router } from "express";
import { getIndex } from "../controllers/index.js";
import { getCurrentUser } from "../middlewares/getCurrentUser.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";

const router = Router();

router.get("/", getUrlAndPath, getCurrentUser, getIndex);

export default router;
