import { Router } from "express";
import { workoutHistoryController } from "../controllers/workoutHistoryController.js";
import { getHelpers } from "../middleware/getHelpers.js";
import { getSessionState } from "../middleware/getSessionState.js";
import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import validateRequestParams from "../middleware/validateRequestParams.js";
import validateRequestQuery from "../middleware/validateRequestQuery.js";
import {
	workoutHistoryParamsSchema,
	workoutHistoryQuerySchema,
} from "../validation/workoutHistorySchemas.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getHelpers);
router.use(getSessionState);

router.get(
	"/",
	validateRequestQuery(workoutHistoryQuerySchema),
	workoutHistoryController.showList,
);
router.get(
	"/:workoutSessionId",
	validateRequestParams(workoutHistoryParamsSchema),
	validateRequestQuery(workoutHistoryQuerySchema),
	workoutHistoryController.showDetail,
);
router.use(workoutHistoryController.handleError);

export default router;
