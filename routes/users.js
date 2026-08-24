import express from "express";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { getSessionState } from "../middlewares/getSessionState.js";
import validateRequestBody from "../middlewares/validateRequestBody.js";
import { userController } from "../src/interfaces/controllers/userController.js";
import { profileController } from "../src/interfaces/controllers/profileController.js";
import { createUserSchema } from "../src/interfaces/validation/createUserSchema.js";

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
