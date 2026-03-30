import { Router } from "express";
import { addNewExerciseVariant } from "../controllers/exercise_variants.js";

const router = Router();

router.post("/", addNewExerciseVariant);

export default router;
