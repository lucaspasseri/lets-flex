import { Router } from "express";
import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import { getSessionState } from "../middleware/getSessionState.js";
import validateRequestBody from "../middleware/validateRequestBody.js";
import validateRequestParams from "../middleware/validateRequestParams.js";
import { sessionController } from "../controllers/sessionController.js";
import {
	createSessionTemplateSchema,
	sessionTemplateParamsSchema,
	updateSessionTemplateSchema,
} from "../validation/sessionTemplateSchemas.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getSessionState);

router.post(
	"/",
	validateRequestBody(createSessionTemplateSchema, sessionController.showCreateErrors),
	sessionController.create,
);
router.patch(
	"/:sessionId",
	validateRequestParams(sessionTemplateParamsSchema),
	validateRequestBody(updateSessionTemplateSchema, sessionController.showUpdateErrors),
	sessionController.update,
);
router.patch(
	"/:sessionId/archive",
	validateRequestParams(sessionTemplateParamsSchema),
	sessionController.archive,
);

export default router;
