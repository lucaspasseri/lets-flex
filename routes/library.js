import { Router } from "express";
import { renderLibraryPage } from "../controllers/library.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getCurrentUserFromParams } from "../middlewares/getCurrentUserFromParams.js";

const router = new Router();

router.get("/", getUrlAndPath, getCurrentUserFromParams, renderLibraryPage);

export default router;
