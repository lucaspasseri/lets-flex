import { Router } from "express";
import { exerciseTemplateController } from "../src/interfaces/controllers/exerciseTemplateController.js";

const router = new Router();

router.post("/", exerciseTemplateController.create);
router.delete("/:exerciseId", exerciseTemplateController.delete);

export default router;
