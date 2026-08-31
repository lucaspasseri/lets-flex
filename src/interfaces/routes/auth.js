import { Router } from "express";
import { authController, buildLoginHandler } from "../controllers/authController.js";
import { requireAnonymous, requireAuthentication } from "../middleware/auth.js";
import rateLimitGuestCreation from "../middleware/rateLimitGuestCreation.js";

export default function createAuthRouter(passport) {
	const router = Router();
	router.get("/login", requireAnonymous, authController.show);
	router.post("/login", requireAnonymous, buildLoginHandler(passport));
	router.post(
		"/guest",
		requireAnonymous,
		rateLimitGuestCreation,
		authController.enterGuest,
	);
	router.post("/logout", requireAuthentication, authController.logout);
	return router;
}
