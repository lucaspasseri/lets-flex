import { Router } from "express";
import { getCurrentUser } from "../middlewares/getCurrentUser.js";
import { renderProfilePage } from "../controllers/profile.js";

const router = Router();

router.get("/", getCurrentUser, renderProfilePage);

export default router;
