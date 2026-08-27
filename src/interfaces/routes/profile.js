import { Router } from "express";

import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import { getSessionState } from "../middleware/getSessionState.js";
import { profileController } from "../controllers/profileController.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getSessionState);

router.post("/clear-selection", profileController.clearSelection);
router.get("/", profileController.show);

export default router;
