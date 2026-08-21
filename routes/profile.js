import { Router } from "express";

import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { profileController } from "../src/interfaces/controllers/profileController.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getSessionState);

router.post("/clear-selection", profileController.clearSelection);
router.get("/", profileController.show);

export default router;
