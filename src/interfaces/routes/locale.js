import { Router } from "express";
import { localeController } from "../controllers/localeController.js";
import validateRequestBody from "../middleware/validateRequestBody.js";
import { localeSelectionSchema } from "../validation/localeSchemas.js";

const router = Router();

router.post(
	"/",
	validateRequestBody(localeSelectionSchema, (_req, res) => {
		res.status(400).send(
			res.locals?.t?.("validation.unsupportedLocale", {
				defaultValue: "Unsupported locale.",
			}) ?? "Unsupported locale.",
		);
	}),
	localeController.set,
);

export default router;
