import { Router } from "express";
import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import { getSessionState } from "../middleware/getSessionState.js";
import validateRequestBody from "../middleware/validateRequestBody.js";
import validateRequestParams from "../middleware/validateRequestParams.js";
import { exerciseTemplateController } from "../controllers/exerciseTemplateController.js";
import {
	createExerciseTemplateSchema,
	exerciseTemplateParamsSchema,
	exerciseTemplateVariantParamsSchema,
	updateExerciseTemplateSchema,
} from "../validation/exerciseTemplateSchemas.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getSessionState);

router.post(
	"/",
	validateRequestBody(
		createExerciseTemplateSchema,
		exerciseTemplateController.showCreateErrors,
	),
	exerciseTemplateController.create,
);
router.patch(
	"/:exerciseId/variants/:variantId",
	validateRequestParams(exerciseTemplateVariantParamsSchema),
	validateRequestBody(
		updateExerciseTemplateSchema,
		exerciseTemplateController.showUpdateErrors,
	),
	exerciseTemplateController.update,
);
router.delete(
	"/:exerciseId",
	validateRequestParams(exerciseTemplateParamsSchema),
	exerciseTemplateController.delete,
);

export default router;
