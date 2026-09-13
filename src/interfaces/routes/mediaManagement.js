import { Router } from "express";

import { mediaManagementController } from "../controllers/mediaManagementController.js";
import { requireAdmin } from "../middleware/auth.js";
import { getSessionState } from "../middleware/getSessionState.js";
import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import validateRequestBody from "../middleware/validateRequestBody.js";
import validateRequestQuery from "../middleware/validateRequestQuery.js";
import {
	existingMediaBodySchema,
	mediaManagementQuerySchema,
	mediaUploadBodySchema,
	removeMediaBodySchema,
} from "../validation/mediaManagementSchemas.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getSessionState);
router.use(requireAdmin);

router.get(
	"/",
	validateRequestQuery(mediaManagementQuerySchema),
	mediaManagementController.show,
);
router.post(
	"/upload",
	validateRequestBody(
		mediaUploadBodySchema,
		mediaManagementController.showUploadValidationErrors,
	),
	mediaManagementController.upload,
);
router.post(
	"/assign",
	validateRequestBody(
		existingMediaBodySchema,
		mediaManagementController.showExistingValidationErrors,
	),
	mediaManagementController.assign,
);
router.post(
	"/remove",
	validateRequestBody(
		removeMediaBodySchema,
		mediaManagementController.showRemoveValidationErrors,
	),
	mediaManagementController.remove,
);

export default router;
