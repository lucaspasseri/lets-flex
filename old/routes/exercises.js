import { Router } from "express";
import { addNewExercise } from "../controllers/exercises.js";

const router = Router();

router.post("/", addNewExercise);

export default router;
