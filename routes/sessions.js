import { Router } from "express";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import validateRequestBody from "../middlewares/validateRequestBody.js";
import { sessionController } from "../src/interfaces/controllers/sessionController.js";
import { updateSessionTemplateSchema } from "../src/interfaces/validation/sessionTemplateSchemas.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getSessionState);

router.post("/", sessionController.create);
router.patch(
	"/:sessionId",
	validateRequestBody(updateSessionTemplateSchema, sessionController.showUpdateErrors),
	sessionController.update,
);
router.patch("/:sessionId/archive", sessionController.archive);

export default router;
