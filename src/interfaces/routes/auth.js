import { Router } from "express";
import {
	authController,
	buildGoogleCallbackHandler,
	buildGoogleLinkStartHandler,
	buildGoogleReplaceStartHandler,
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
	router.post(
		"/google/link",
		requireAuthentication,
		buildGoogleLinkStartHandler(passport),
	);
	router.post(
		"/google/replace",
		requireAuthentication,
		buildGoogleReplaceStartHandler(passport),
	);
	router.get("/google/callback", buildGoogleCallbackHandler(passport));
	router.post(
		"/guest",
		requireAnonymous,
		rateLimitGuestCreation,
		authController.enterGuest,
	);
	router.post("/logout", requireAuthentication, authController.logout);
	return router;
}
