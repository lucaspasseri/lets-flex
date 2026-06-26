import { Router } from "express";

import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { libraryController } from "../controllers/libraryController.js";

const router = new Router();

router.use(getUrlAndPath);
router.use(getSessionState);

router.get("/", libraryController.show);

export default router;
