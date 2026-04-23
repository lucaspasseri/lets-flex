import { Router } from "express";
import { getCurrentUser } from "../middlewares/getCurrentUser.js";
import {
	renderProfilePage,
	renderProfilePageByUserId,
} from "../controllers/profile.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getCurrentUserByParams } from "../middlewares/getCurrentUserByParams.js";

const router = Router();

router.get(
	"/",
	getUrlAndPath,
	getCurrentUserByParams,
	renderProfilePageByUserId,
);
router.get(
	"/user/:userId",
	getUrlAndPath,
	getCurrentUserByParams,
	renderProfilePageByUserId,
);

export default router;
