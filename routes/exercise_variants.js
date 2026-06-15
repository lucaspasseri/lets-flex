import { Router } from "express";
import {
	addNewExerciseVariant,
	deleteExerciseVariant,
} from "../controllers/exercise_variants.js";

const router = Router();

router.post("/", addNewExerciseVariant);
router.delete(
	"/:exerciseVariantId",

	deleteExerciseVariant,
);

export default router;
