import { Router } from "express";
import { exerciseVariantController } from "../controllers/exerciseVariantController.js";
import validateRequestBody from "../middleware/validateRequestBody.js";
import validateRequestParams from "../middleware/validateRequestParams.js";
import {
	createPrivateVariantParamsSchema,
	privateVariantBodySchema,
	privateVariantParamsSchema,
} from "../validation/exerciseTemplateSchemas.js";

const router = Router();
const invalid = (_req, res, { errors }) => res.status(422).json(errors);

router.post(
	"/exercises/:exerciseId/variants",
	validateRequestParams(createPrivateVariantParamsSchema),
	validateRequestBody(privateVariantBodySchema, invalid),
	exerciseVariantController.create,
);
router.patch(
	"/exercise-variants/:variantId",
	validateRequestParams(privateVariantParamsSchema),
	validateRequestBody(privateVariantBodySchema, invalid),
	exerciseVariantController.update,
);
router.post(
	"/exercise-variants/:variantId/archive",
	validateRequestParams(privateVariantParamsSchema),
	exerciseVariantController.archive,
);

export default router;
