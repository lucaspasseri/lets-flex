import { Router } from "express";

const router = Router();

// controller?
router.get("/", (_req, res) => {
	res.render("profile", {
		data: {
			title: "Let's Flex!",
			path: "/profile",
		},
	});
});

export default router;
