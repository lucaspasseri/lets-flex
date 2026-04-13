import { Router } from "express";
import { addNewExerciseCluster } from "../controllers/exercise_cluster.js";

const router = new Router();

router.post("/", addNewExerciseCluster);

export default router;
