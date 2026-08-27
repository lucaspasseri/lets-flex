import express from "express";
import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import { getHelpers } from "../middleware/getHelpers.js";
import { getSessionState } from "../middleware/getSessionState.js";
import { programsController } from "../controllers/programController.js";
import { dayController } from "../controllers/dayController.js";
import validateRequestBody from "../middleware/validateRequestBody.js";
import {
	createProgramSchema,
	programParamsSchema,
} from "../validation/programSchemas.js";
import validateRequestQuery from "../middleware/validateRequestQuery.js";
import validateRequestParams from "../middleware/validateRequestParams.js";
import { dayPageQuerySchema } from "../validation/daySchemas.js";

const router = express.Router();

router.use(getUrlAndPath);
router.use(getHelpers);
router.use(getSessionState);

router.post(
	"/",
	validateRequestBody(createProgramSchema, programsController.showCreateErrors),
	programsController.create,
);

router.get("/", programsController.show);

router.delete(
	"/:programId",
	validateRequestParams(programParamsSchema),
	programsController.delete,
);

router.get("/day", validateRequestQuery(dayPageQuerySchema), dayController.show);

export default router;
