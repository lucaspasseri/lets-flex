import { Router } from "express";
import { renderLibraryPage } from "../controllers/library.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getCurrentUserFromParams } from "../middlewares/getCurrentUserFromParams.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { makeCurrentEntity } from "../middlewares/makeCurrentEntity.js";
import pool from "../db/pool.js";
import * as usersDb from "../db/users/index.js";
import { makeCurrentValue } from "../middlewares/makeCurrentValue.js";
import { loadLibraryPageData } from "../middlewares/loadLibraryPageData.js";

const router = new Router();

router.get(
	"/",
	getUrlAndPath,
	getSessionState,
	makeCurrentEntity({
		pageParamsKey: "libraryPageParams",
		sessionKey: "userId",
		appStateKey: "currentUser",
		getById: userId => usersDb.getUserById(pool, { userId }),
	}),
	makeCurrentValue({
		pageParamsKey: "libraryPageParams",
		paramKey: "sessionId",
		sessionKey: "sessionId",
		transform: Number,
	}),
	loadLibraryPageData,
	renderLibraryPage,
);

export default router;
