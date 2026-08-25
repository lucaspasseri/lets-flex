import { Router } from "express";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import validateRequestBody from "../middlewares/validateRequestBody.js";
import { exerciseTemplateController } from "../src/interfaces/controllers/exerciseTemplateController.js";
import { updateExerciseTemplateSchema } from "../src/interfaces/validation/exerciseTemplateSchemas.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getSessionState);

router.post("/", exerciseTemplateController.create);
router.patch(
	"/:exerciseId/variants/:variantId",
	validateRequestBody(
		updateExerciseTemplateSchema,
		exerciseTemplateController.showUpdateErrors,
	),
	exerciseTemplateController.update,
);
router.delete("/:exerciseId", exerciseTemplateController.delete);

export default router;
