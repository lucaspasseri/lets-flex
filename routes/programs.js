import express from "express";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getHelpers } from "../middlewares/getHelpers.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import { programsController } from "../src/interfaces/controllers/programController.js";
import { dayController } from "../src/interfaces/controllers/dayController.js";
import validateRequestBody from "../middlewares/validateRequestBody.js";
import {
	createProgramSchema,
	programParamsSchema,
} from "../src/interfaces/validation/programSchemas.js";
import validateRequestQuery from "../middlewares/validateRequestQuery.js";
import validateRequestParams from "../middlewares/validateRequestParams.js";
import { dayPageQuerySchema } from "../src/interfaces/validation/daySchemas.js";

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
