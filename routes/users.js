import express from "express";
import { addNewUser, setUser } from "../controllers/users.js";

const router = express.Router();

router.post("/", addNewUser);
router.post("/set-user", setUser);

export default router;
