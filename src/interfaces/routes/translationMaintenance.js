import { Router } from "express";

import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import { getSessionState } from "../middleware/getSessionState.js";
import { requireAdmin } from "../middleware/auth.js";
import validateRequestBody from "../middleware/validateRequestBody.js";
import validateRequestParams from "../middleware/validateRequestParams.js";
import validateRequestQuery from "../middleware/validateRequestQuery.js";
import { translationMaintenanceController } from "../controllers/translationMaintenanceController.js";
import {
	translationMaintenanceBodySchema,
	translationMaintenanceParamsSchema,
	translationOverviewQuerySchema,
} from "../validation/translationMaintenanceSchemas.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getSessionState);
router.use(requireAdmin);

router.get(
	"/",
	validateRequestQuery(translationOverviewQuerySchema),
	translationMaintenanceController.showOverview,
);

router.get(
	"/:entityType/:entityId",
	validateRequestParams(translationMaintenanceParamsSchema),
	translationMaintenanceController.showEditor,
);

router.patch(
	"/:entityType/:entityId",
	validateRequestParams(translationMaintenanceParamsSchema),
	validateRequestBody(
		translationMaintenanceBodySchema,
		translationMaintenanceController.showUpdateErrors,
	),
	translationMaintenanceController.update,
);

export default router;
