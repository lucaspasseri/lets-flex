import { Router } from "express";
import { addNewExerciseMuscle } from "../controllers/exercise_muscles.js";

const router = Router();

router.post("/", addNewExerciseMuscle);

export default router;
