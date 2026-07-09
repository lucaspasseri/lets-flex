import express from "express";
import { addNewUser } from "../controllers/users.js";
import { getUrlAndPath } from "../middlewares/getUrlAndPath.js";

const router = express.Router();

router.use(getUrlAndPath);

router.post("/", addNewUser);
router.post("/clear-session", (req, res) => {
	delete req.session.state;

	const { backUrl, backUrlWithoutParams } = res.locals.page;

	if (backUrlWithoutParams === "/profile/") res.redirect(backUrlWithoutParams);

	res.redirect(backUrl);
});

export default router;
