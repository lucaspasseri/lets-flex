import express from "express";
import { addNewProgram } from "../controllers/programs.js";

const router = express.Router();

// controller?
router.get("/", (_req, res) => {
	res.render("programs", {
		data: {
			title: "Let's Flex!",
			path: "/programs",
		},
	});
});

router.post("/", addNewProgram);

export default router;
