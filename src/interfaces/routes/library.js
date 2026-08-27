import { Router } from "express";

import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import { getSessionState } from "../middleware/getSessionState.js";
import { libraryController } from "../controllers/libraryController.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getSessionState);

router.get("/", libraryController.show);

export default router;
