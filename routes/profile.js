import { Router } from "express";
import { getCurrentUser } from "../middlewares/getCurrentUser.js";
import { renderProfilePage } from "../controllers/profile.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";

const router = Router();

router.get("/", getUrlAndPath, getCurrentUser, renderProfilePage);

export default router;
