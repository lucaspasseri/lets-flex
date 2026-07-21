import express from "express";
import { addNewUser, clearSession } from "../controllers/users.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";
import { userController } from "../src/interfaces/controllers/userController.js";

const router = express.Router();

router.use(getUrlAndPath);

router.post("/", userController.create);
router.post("/clear-session", userController.reset);

export default router;
