import { Router } from "express";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import validateRequestBody from "../middlewares/validateRequestBody.js";
import validateRequestParams from "../middlewares/validateRequestParams.js";
import { sessionController } from "../src/interfaces/controllers/sessionController.js";
import {
	createSessionTemplateSchema,
	sessionTemplateParamsSchema,
	updateSessionTemplateSchema,
} from "../src/interfaces/validation/sessionTemplateSchemas.js";

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
