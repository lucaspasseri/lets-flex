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
	createPrivateVariantParamsSchema,
	privateVariantBodySchema,
	updateExerciseTemplateSchema,
} from "../validation/exerciseTemplateSchemas.js";
import { libraryController } from "../controllers/libraryController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getSessionState);
router.use(requireAdmin);

router.get("/", libraryController.showAdmin);

router.post(
	"/",
	validateRequestBody(
		createExerciseTemplateSchema,
		exerciseTemplateController.showCreateErrors,
	),
	exerciseTemplateController.create,
);
router.post(
	"/:exerciseId/variants",
	validateRequestParams(createPrivateVariantParamsSchema),
	validateRequestBody(privateVariantBodySchema, (_req, res, { errors }) =>
		res.status(422).json(errors),
	),
	exerciseTemplateController.createGlobalVariant,
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
router.post(
	"/:exerciseId/archive",
	validateRequestParams(exerciseTemplateParamsSchema),
	exerciseTemplateController.delete,
);

export default router;
