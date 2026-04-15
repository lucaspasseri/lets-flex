import { Router } from "express";
import { renderLibraryPage } from "../controllers/library.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getCurrentUser } from "../middlewares/getCurrentUser.js";

const router = new Router();

router.get("/", getUrlAndPath, getCurrentUser, renderLibraryPage);

export default router;
