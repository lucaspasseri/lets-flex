import { Router } from "express";
import { renderLibraryPage } from "../controllers/library.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";

const router = new Router();

router.get("/", getUrlAndPath, renderLibraryPage);

export default router;
