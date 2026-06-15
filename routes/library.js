import { Router } from "express";

import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { setLibraryPageContext } from "../middlewares/setLibraryPageContext.js";
import { loadLibraryPageData } from "../middlewares/loadLibraryPageData.js";
import { renderLibraryPage } from "../controllers/library.js";
import { setActiveSession } from "../middlewares/setActiveSession.js";
import { getLibraryPageParams } from "../middlewares/getLibraryPageParams.js";

const router = new Router();

router.get(
	"/",
	getUrlAndPath,
	getSessionState,
	getLibraryPageParams,
	setLibraryPageContext,
	loadLibraryPageData,
	setActiveSession,
	renderLibraryPage,
);

export default router;
