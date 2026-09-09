import { Router } from "express";
import { exerciseProgressController } from "../controllers/exerciseProgressController.js";
import { getHelpers } from "../middleware/getHelpers.js";
import { getSessionState } from "../middleware/getSessionState.js";
import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import validateRequestQuery from "../middleware/validateRequestQuery.js";
import { exerciseProgressQuerySchema } from "../validation/exerciseProgressSchemas.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getHelpers);
router.use(getSessionState);

router.get(
	"/",
	validateRequestQuery(exerciseProgressQuerySchema),
	exerciseProgressController.show,
);
router.use(exerciseProgressController.handleError);

export default router;
