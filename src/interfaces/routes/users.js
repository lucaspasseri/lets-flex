import express from "express";
import { getUrlAndPath } from "../middleware/getUrlAndPath.js";
import { getSessionState } from "../middleware/getSessionState.js";
import validateRequestBody from "../middleware/validateRequestBody.js";
import { userController } from "../controllers/userController.js";
import { profileController } from "../controllers/profileController.js";
import { createUserSchema } from "../validation/createUserSchema.js";

const router = express.Router();

router.use(getUrlAndPath);
router.use(getSessionState);

router.post(
	"/",
	validateRequestBody(createUserSchema, profileController.showCreateUserErrors),
	userController.create,
);
router.post("/clear-session", userController.reset);

export default router;
