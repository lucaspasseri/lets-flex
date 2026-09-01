import { Router } from "express";
import {
	authController,
	buildGoogleCallbackHandler,
	buildGoogleStartHandler,
	buildLoginHandler,
} from "../controllers/authController.js";
import {
	requireAnonymous,
	requireAnonymousOrGuest,
	requireAuthentication,
} from "../middleware/auth.js";
import rateLimitGuestCreation from "../middleware/rateLimitGuestCreation.js";

export default function createAuthRouter(passport) {
	const router = Router();
	router.get("/login", requireAnonymousOrGuest, authController.show);
	router.post("/login", requireAnonymous, buildLoginHandler(passport));
	router.post("/register", requireAnonymousOrGuest, authController.register);
	router.get("/google", requireAnonymousOrGuest, buildGoogleStartHandler(passport));
	router.get(
		"/google/callback",
		requireAnonymousOrGuest,
		buildGoogleCallbackHandler(passport),
	);
	router.post(
		"/guest",
		requireAnonymous,
		rateLimitGuestCreation,
		authController.enterGuest,
	);
	router.post("/logout", requireAuthentication, authController.logout);
	return router;
}
