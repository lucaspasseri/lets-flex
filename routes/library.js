import { Router } from "express";
import { renderLibraryPage } from "../controllers/library.js";

const router = new Router();

router.get("/", renderLibraryPage);

export default router;
