import express from "express";
import { addNewProgram } from "../controllers/programs.js";

const router = express.Router();

router.post("/", addNewProgram);

export default router;
