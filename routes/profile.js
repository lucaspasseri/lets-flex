import { Router } from "express";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { getProfilePageParams } from "../middlewares/getProfilePageParams.js";
import { getCurrentUserFromParams } from "../middlewares/getCurrentUserFromParams.js";
import { renderProfilePage } from "../controllers/profile.js";
import { makeCurrentEntity } from "../middlewares/makeCurrentEntity.js";
import * as usersDb from "../db/users/index.js";
import pool from "../db/pool.js";
import { loadProfilePageData } from "../middlewares/loadProfilePageData.js";

const router = Router();

router.get(
	"/",
	getUrlAndPath,
	getSessionState,
	getProfilePageParams,
	makeCurrentEntity({
		pageParamsKey: "profilePageParams",
		paramKey: "userId",
		sessionKey: "userId",
		appStateKey: "currentUser",
		getById: userId => usersDb.getUserById(pool, { userId }),
	}),
	loadProfilePageData,
	renderProfilePage,
);

export default router;
