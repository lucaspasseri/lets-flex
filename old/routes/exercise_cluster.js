import { Router } from "express";
import { addNewExerciseCluster } from "../controllers/exercise_cluster.js";
import { exerciseTemplateController } from "../../src/interfaces/controllers/exerciseTemplateController.js";

const router = new Router();

router.post("/", exerciseTemplateController.create);

export default router;
