import express from "express";
import { addNewUser, clearSession } from "../controllers/users.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";

const router = express.Router();

router.use(getUrlAndPath);

router.post("/", addNewUser);
router.post("/clear-session", clearSession);

export default router;
