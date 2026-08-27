import { Router } from "express";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import validateRequestBody from "../middlewares/validateRequestBody.js";
import validateRequestParams from "../middlewares/validateRequestParams.js";
import { exerciseTemplateController } from "../src/interfaces/controllers/exerciseTemplateController.js";
import {
	createExerciseTemplateSchema,
	exerciseTemplateParamsSchema,
	exerciseTemplateVariantParamsSchema,
	updateExerciseTemplateSchema,
} from "../src/interfaces/validation/exerciseTemplateSchemas.js";

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
