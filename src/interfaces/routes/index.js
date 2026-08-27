import { Router } from "express";
import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import { getHelpers } from "../middleware/getHelpers.js";
import { getSessionState } from "../middleware/getSessionState.js";
import { dashboardController } from "../controllers/dashboardController.js";
import validateRequestQuery from "../middleware/validateRequestQuery.js";
import { dashboardQuerySchema } from "../validation/dashboardSchemas.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getHelpers);
router.use(getSessionState);

router.get("/", validateRequestQuery(dashboardQuerySchema), dashboardController.show);

export default router;
