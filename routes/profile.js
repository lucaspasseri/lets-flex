import { Router } from "express";

import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { getProfilePageParams } from "../middlewares/getProfilePageParams.js";
import { setProfilePageContext } from "../middlewares/setProfilePageContext.js";
import { loadProfilePageData } from "../middlewares/loadProfilePageData.js";
import { renderProfilePage } from "../controllers/profile.js";

const router = Router();

router.get(
	"/",
	getUrlAndPath,
	getSessionState,
	getProfilePageParams,
	setProfilePageContext,
	loadProfilePageData,
	renderProfilePage,
);

export default router;
