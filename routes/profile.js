import { Router } from "express";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { getProfilePageParams } from "../middlewares/getProfilePageParams.js";
import { getCurrentUserFromParams } from "../middlewares/getCurrentUserFromParams.js";
import { renderProfilePage } from "../controllers/profile.js";

const router = Router();

router.get(
	"/",
	getUrlAndPath,
	getSessionState,
	getProfilePageParams,
	getCurrentUserFromParams,
	renderProfilePage,
);

export default router;
