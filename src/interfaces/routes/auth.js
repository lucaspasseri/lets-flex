import { Router } from "express";
import {
	authController,
	buildGoogleCallbackHandler,
	buildGoogleLinkStartHandler,
	buildGoogleReplaceStartHandler,
	buildGoogleStartHandler,
	buildLoginHandler,
	buildPasswordResetHandlers,
} from "../controllers/authController.js";
import {
	requireAnonymous,
	requireAnonymousOrGuest,
	requireAuthentication,
} from "../middleware/auth.js";
import rateLimitGuestCreation from "../middleware/rateLimitGuestCreation.js";
import rateLimitPasswordReset from "../middleware/rateLimitPasswordReset.js";

export default function createAuthRouter(passport, { emailService }) {
	const router = Router();
	const passwordReset = buildPasswordResetHandlers(emailService);
	router.get("/login", requireAnonymousOrGuest, authController.show);
	router.post("/login", requireAnonymous, buildLoginHandler(passport));
	router.post("/register", requireAnonymousOrGuest, authController.register);
	router.get("/password-reset/request", requireAnonymous, passwordReset.showRequest);
	router.post(
		"/password-reset/request",
		requireAnonymous,
		rateLimitPasswordReset,
		passwordReset.request,
	);
	router.get("/password-reset", requireAnonymous, passwordReset.showReset);
	router.post("/password-reset", requireAnonymous, passwordReset.reset);
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
