import { Router } from "express";

import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import { profileController } from "../controllers/profileController.js";

const router = Router();

router.use(getUrlAndPath);
router.get("/", profileController.show);

export default router;
