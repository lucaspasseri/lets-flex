import express from "express";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getHelpers } from "../middlewares/getHelpers.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { programsController } from "../src/interfaces/controllers/programController.js";
import { dayController } from "../src/interfaces/controllers/dayController.js";

const router = express.Router();

router.use(getUrlAndPath);
router.use(getHelpers);
router.use(getSessionState);

router.post("/", programsController.create);

router.get("/", programsController.show);

router.get("/day", dayController.show);

export default router;
