import { Router } from "express";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getHelpers } from "../middlewares/getHelpers.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { dashboardController } from "../src/interfaces/controllers/dashboardController.js";
import validateRequestQuery from "../middlewares/validateRequestQuery.js";
import { dashboardQuerySchema } from "../src/interfaces/validation/dashboardSchemas.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getHelpers);
router.use(getSessionState);

router.get("/", validateRequestQuery(dashboardQuerySchema), dashboardController.show);

export default router;
