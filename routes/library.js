import { Router } from "express";

import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { setLibraryPageContext } from "../middlewares/setLibraryPageContext.js";
import { loadLibraryPageData } from "../middlewares/loadLibraryPageData.js";
import { renderLibraryPage } from "../controllers/library.js";

const router = new Router();

router.get(
	"/",
	getUrlAndPath,
	getSessionState,
	setLibraryPageContext,
	loadLibraryPageData,
	renderLibraryPage,
);

export default router;
