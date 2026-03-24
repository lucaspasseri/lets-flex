import express from "express";
import { addNewUser } from "../controllers/users.js";

const router = express.Router();

router.post("/", addNewUser);

export default router;
