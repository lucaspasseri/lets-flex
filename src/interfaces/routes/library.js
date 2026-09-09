import { Router } from "express";

import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import { getSessionState } from "../middleware/getSessionState.js";
import { libraryController } from "../controllers/libraryController.js";
import validateRequestQuery from "../middleware/validateRequestQuery.js";
import { libraryPageQuerySchema } from "../validation/librarySchemas.js";

const router = Router();

router.use(getUrlAndPath);
router.use(getSessionState);

router.get("/", validateRequestQuery(libraryPageQuerySchema), libraryController.show);

export default router;
