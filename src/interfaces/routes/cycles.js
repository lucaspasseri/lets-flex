import express from "express";
import { cycleController } from "../controllers/cycleController.js";
import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import { getHelpers } from "../middleware/getHelpers.js";
import { getSessionState } from "../middleware/getSessionState.js";
import validateRequestBody from "../middleware/validateRequestBody.js";
import { createCycleSchema, cycleParamsSchema } from "../validation/programSchemas.js";
import validateRequestParams from "../middleware/validateRequestParams.js";
import { respondWithApplicationRecovery } from "../applicationRecovery.js";

const router = express.Router();

// Cycle management is rendered by /programs. Keep direct GETs on this mutation endpoint
// deterministic and out of the mutation middleware chain.
router.get("/", (req, res) => {
	respondWithApplicationRecovery(req, res, { kind: "notFound" });
});

router.use(getUrlAndPath);
router.use(getHelpers);
router.use(getSessionState);

router.post(
	"/",
	validateRequestBody(createCycleSchema, cycleController.showCreateErrors),
	cycleController.create,
);

router.delete(
	"/:cycleId",
	validateRequestParams(cycleParamsSchema),
	cycleController.delete,
);

export default router;
