import { randomBytes, timingSafeEqual } from "node:crypto";
import asyncHandler from "../../../utils/asyncControllerHandler.js";
import {
	GoogleEmailConflictError,
	GoogleProfileError,
} from "../../features/auth/authenticateGoogleUser.js";
import { GuestConversionUnavailableError } from "../../features/auth/createOrConvertRegisteredUser.js";
import createGuest from "../../features/auth/createGuest.js";
import registerUser from "../../features/auth/registerUser.js";
import * as usersRepository from "../../features/users/repository.js";
import establishAuthenticatedSession from "../auth/establishAuthenticatedSession.js";
import {
	loginSchema,
	registrationSchema,
	safeReturnTo,
} from "../validation/authSchemas.js";

/** @param {any} req @param {any} res @param {Record<string, any>} [state] */
function renderLogin(req, res, state = {}) {
	const returnTo = safeReturnTo(state.returnTo ?? req.query?.returnTo);
	res.render("login", {
		layout: "./layouts/authShell",
		page: { title: "Sign in · Let's Flex!" },
		returnTo,
		googleAuthUrl: `/auth/google?returnTo=${encodeURIComponent(returnTo)}`,
		email: state.email ?? "",
		errors: state.errors ?? [],
		activeTab: state.activeTab ?? (req.query?.tab === "signup" ? "signup" : "signin"),
	});
}

/** @param {any} req @param {any} res */
function show(req, res) {
	renderLogin(req, res);
}

/** @param {any} req */
function saveSession(req) {
	return new Promise((resolve, reject) => {
		req.session.save((error) => (error ? reject(error) : resolve(undefined)));
	});
}

/** @param {unknown} actual @param {unknown} expected */
function oauthStatesMatch(actual, expected) {
	if (typeof actual !== "string" || typeof expected !== "string") return false;
	const actualBuffer = Buffer.from(actual);
	const expectedBuffer = Buffer.from(expected);
	return (
		actualBuffer.length === expectedBuffer.length &&
		timingSafeEqual(actualBuffer, expectedBuffer)
	);
}

/** @param {any} req */
async function consumeGoogleOAuthState(req) {
	const stored = req.session.googleOAuth;
	delete req.session.googleOAuth;
	await saveSession(req);
	return {
		valid: oauthStatesMatch(req.query?.state, stored?.state),
		returnTo: safeReturnTo(stored?.returnTo),
	};
}

/** @param {any} req @param {any} res @param {{status?: number, message: string, returnTo?: string}} state */
function renderGoogleFailure(req, res, { status = 401, message, returnTo = "/" }) {
	res.status(status);
	renderLogin(req, res, { errors: [message], returnTo });
}

/** @param {unknown} error */
function isOAuthProviderError(error) {
	return (
		error instanceof Error &&
		new Set(["AuthorizationError", "TokenError", "InternalOAuthError"]).has(error.name)
	);
}

/** @param {any} passport */
export function buildGoogleStartHandler(passport) {
	return asyncHandler(async (req, res, next) => {
		const state = randomBytes(32).toString("hex");
		req.session.googleOAuth = {
			state,
			returnTo: safeReturnTo(req.query?.returnTo),
		};
		await saveSession(req);
		passport.authenticate("google", {
			scope: ["profile", "email"],
			state,
		})(req, res, next);
	});
}

/** @param {any} passport */
export function buildGoogleCallbackHandler(passport) {
	return asyncHandler(async (req, res, next) => {
		const oauthState = await consumeGoogleOAuthState(req);
		if (!oauthState.valid) {
			renderGoogleFailure(req, res, {
				status: 403,
				message: "Google sign-in could not be verified. Please try again.",
			});
			return;
		}
		if (req.query?.error || typeof req.query?.code !== "string") {
			renderGoogleFailure(req, res, {
				message: "Google sign-in was cancelled or could not be completed.",
				returnTo: oauthState.returnTo,
			});
			return;
		}

		passport.authenticate("google", { session: false }, async (error, user) => {
			if (error instanceof GoogleEmailConflictError) {
				renderGoogleFailure(req, res, {
					status: 409,
					message: error.message,
					returnTo: oauthState.returnTo,
				});
				return;
			}
			if (
				error instanceof GoogleProfileError ||
				error instanceof GuestConversionUnavailableError
			) {
				renderGoogleFailure(req, res, {
					status: 422,
					message: error.message,
					returnTo: oauthState.returnTo,
				});
				return;
			}
			if (isOAuthProviderError(error)) {
				renderGoogleFailure(req, res, {
					message: "Google sign-in could not be completed. Please try again.",
					returnTo: oauthState.returnTo,
				});
				return;
			}
			if (error) return next(error);
			if (!user) {
				renderGoogleFailure(req, res, {
					message: "Google sign-in could not be completed. Please try again.",
					returnTo: oauthState.returnTo,
				});
				return;
			}

			try {
				await establishAuthenticatedSession(req, user);
				res.redirect(safeReturnTo(oauthState.returnTo));
			} catch (sessionError) {
				next(sessionError);
			}
		})(req, res, next);
	});
}

/** @param {any} passport */
export function buildLoginHandler(passport) {
	return function login(req, res, next) {
		const parsed = loginSchema.safeParse(req.body);
		if (!parsed.success) {
			res.status(422);
			renderLogin(req, res, {
				email: typeof req.body?.email === "string" ? req.body.email : "",
				returnTo: req.body?.returnTo,
				errors: parsed.error.issues.map((issue) => issue.message),
			});
			return;
		}

		passport.authenticate("local", async (error, user, info) => {
			if (error) return next(error);
			if (!user) {
				res.status(401);
				renderLogin(req, res, {
					email: parsed.data.email,
					returnTo: parsed.data.returnTo,
					errors: [info?.message ?? "Invalid email or password."],
				});
				return;
			}
			try {
				await establishAuthenticatedSession(req, user);
				res.redirect(safeReturnTo(parsed.data.returnTo));
			} catch (sessionError) {
				next(sessionError);
			}
		})(req, res, next);
	};
}

/** @param {any} req @param {any} res */
async function register(req, res) {
	const parsed = registrationSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(422);
		renderLogin(req, res, {
			activeTab: "signup",
			email: typeof req.body?.email === "string" ? req.body.email : "",
			returnTo: req.body?.returnTo,
			errors: parsed.error.issues.map((issue) => issue.message),
		});
		return;
	}

	try {
		const principal = /** @type {any} */ (req.user);
		const guestUserId =
			principal?.role === "guest" && Number.isInteger(principal.id)
				? principal.id
				: null;
		const user = await registerUser({ ...parsed.data, guestUserId });
		await establishAuthenticatedSession(req, user);
		res.redirect(safeReturnTo(parsed.data.returnTo));
	} catch (error) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "23505"
		) {
			res.status(409);
			renderLogin(req, res, {
				activeTab: "signup",
				email: parsed.data.email,
				returnTo: parsed.data.returnTo,
				errors: ["An account with that email address already exists."],
			});
			return;
		}
		if (error instanceof GuestConversionUnavailableError) {
			res.status(409);
			renderLogin(req, res, {
				activeTab: "signup",
				email: parsed.data.email,
				returnTo: parsed.data.returnTo,
				errors: [error.message],
			});
			return;
		}
		throw error;
	}
}

/** @param {any} req @param {any} res */
async function enterGuest(req, res) {
	const guest = await createGuest();
	try {
		await establishAuthenticatedSession(req, guest);
		res.redirect("/");
	} catch (error) {
		await usersRepository.deleteGuestById({ userId: guest.id });
		throw error;
	}
}

/** @param {any} req @param {any} res @param {any} next */
function logout(req, res, next) {
	req.logout((logoutError) => {
		if (logoutError) return next(logoutError);
		req.session.destroy((destroyError) => {
			if (destroyError) return next(destroyError);
			res.clearCookie("lets_flex_session");
			res.redirect("/auth/login");
		});
	});
}

export const authController = {
	show,
	register: asyncHandler(register),
	enterGuest: asyncHandler(enterGuest),
	logout,
};

export { consumeGoogleOAuthState, isOAuthProviderError, oauthStatesMatch };
