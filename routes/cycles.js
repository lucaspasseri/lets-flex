import express from "express";
import { addNewCycle } from "../controllers/cycles.js";

const router = express.Router();

router.get("/", (req, res) => {
	res.send("Cycles page");
});

router.post("/", addNewCycle);

export default router;
