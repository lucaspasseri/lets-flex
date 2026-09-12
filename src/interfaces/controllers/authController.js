import { randomBytes, timingSafeEqual } from "node:crypto";
import asyncHandler from "../../../utils/asyncControllerHandler.js";
import {
	GoogleEmailConflictError,
	GoogleProfileError,
} from "../../features/auth/authenticateGoogleUser.js";
import { GuestConversionUnavailableError } from "../../features/auth/createOrConvertRegisteredUser.js";
import {
	GoogleIdentityConflictError,
	GoogleProviderAlreadyLinkedError,
	GoogleReplacementUnavailableError,
} from "../../features/auth/linkGoogleIdentity.js";
import createGuest from "../../features/auth/createGuest.js";
import getAuthenticationMethods from "../../features/auth/getAuthenticationMethods.js";
import registerUser from "../../features/auth/registerUser.js";
import {
	InvalidPasswordResetTokenError,
	isPasswordResetTokenUsable,
	requestPasswordReset,
	resetPassword,
} from "../../features/auth/passwordResetService.js";
import * as usersRepository from "../../features/users/repository.js";
import establishAuthenticatedSession from "../auth/establishAuthenticatedSession.js";
import { respondWithApplicationRecovery } from "../applicationRecovery.js";
import {
	loginSchema,
	passwordResetRequestSchema,
	passwordResetSchema,
	registrationSchema,
	safeReturnTo,
} from "../validation/authSchemas.js";
import translateMessage from "../../infrastructure/i18n/translateMessage.js";
import translateAuthErrors from "../validation/translateAuthErrors.js";

const SAFE_DELIVERY_CATEGORIES = new Set(["provider_rejected", "transport_failure"]);

function authMessage(res, key, defaultValue, values) {
	return translateMessage(res.locals?.t, `auth.${key}`, defaultValue, values);
}

function reportPasswordResetFailure(error) {
	const category = SAFE_DELIVERY_CATEGORIES.has(error?.category)
		? error.category
		: "internal_failure";
	const providerRequestId =
		typeof error?.providerRequestId === "string" &&
		/^[A-Za-z0-9_-]{1,128}$/.test(error.providerRequestId)
			? error.providerRequestId
			: null;
	console.error(
		"Password reset request could not be completed",
		category,
		...(providerRequestId ? [providerRequestId] : []),
	);
}

function renderResetRequest(req, res, state = {}) {
	res.render("password-reset-request", {
		layout: "./layouts/authShell",
		page: { title: authMessage(res, "pageTitleReset", "Reset password · Let's Flex!") },
		email: state.email ?? "",
		errors: state.errors ?? [],
		statusMessage: state.statusMessage ?? "",
	});
}

function renderResetPassword(req, res, state) {
	res.render("password-reset", {
		layout: "./layouts/authShell",
		page: {
			title: authMessage(
				res,
				"pageTitleChoosePassword",
				"Choose a new password · Let's Flex!",
			),
		},
		token: state.token ?? "",
		errors: state.errors ?? [],
	});
}

export function buildPasswordResetHandlers(emailService) {
	return {
		showRequest(_req, res) {
			renderResetRequest(_req, res);
		},
		request: asyncHandler(async (req, res) => {
			const parsed = passwordResetRequestSchema.safeParse(req.body);
			try {
				if (parsed.success)
					await requestPasswordReset({
						email: parsed.data.email,
						emailService,
						language: res.locals?.language,
					});
			} catch (error) {
				// Only stable, allow-listed operational context reaches diagnostics.
				reportPasswordResetFailure(error);
			}
			renderResetRequest(req, res, {
				statusMessage: authMessage(
					res,
					"resetRequestStatus",
					"If that email can use password sign-in, we sent a password reset link.",
				),
			});
		}),
		showReset: asyncHandler(async (req, res) => {
			const token = typeof req.query?.token === "string" ? req.query.token : "";
			if (!(await isPasswordResetTokenUsable(token))) {
				res.status(400);
				renderResetPassword(req, res, {
					token: "",
					errors: [
						authMessage(
							res,
							"invalidResetToken",
							"This password reset link is invalid or has expired.",
						),
					],
				});
				return;
			}
			renderResetPassword(req, res, { token });
		}),
		reset: asyncHandler(async (req, res) => {
			const parsed = passwordResetSchema.safeParse(req.body);
			if (!parsed.success) {
				res.status(422);
				renderResetPassword(req, res, {
					token: typeof req.body?.token === "string" ? req.body.token : "",
					errors: translateAuthErrors(res, parsed.error.issues),
				});
				return;
			}
			try {
				await resetPassword(parsed.data);
				res.redirect("/auth/login?passwordReset=success");
			} catch (error) {
				if (error instanceof InvalidPasswordResetTokenError) {
					res.status(400);
					renderResetPassword(req, res, {
						token: "",
						errors: [
							authMessage(
								res,
								"invalidResetToken",
								"This password reset link is invalid or has expired.",
							),
						],
					});
					return;
				}
				throw error;
			}
		}),
	};
}

/** @param {any} req @param {any} res @param {Record<string, any>} [state] */
function renderLogin(req, res, state = {}) {
	const returnTo = safeReturnTo(state.returnTo ?? req.query?.returnTo);
	res.render("login", {
		layout: "./layouts/authShell",
		page: { title: authMessage(res, "pageTitleSignIn", "Sign in · Let's Flex!") },
		returnTo,
		googleAuthUrl: `/auth/google?returnTo=${encodeURIComponent(returnTo)}`,
		email: state.email ?? "",
		errors: state.errors ?? [],
		statusMessage:
			req.query?.passwordReset === "success"
				? authMessage(
						res,
						"passwordResetSuccess",
						"Your password has been reset. Sign in with your new password.",
					)
				: "",
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
		purpose: new Set(["link", "replace"]).has(stored?.purpose)
			? stored.purpose
			: "login",
		linkUserId: Number.isInteger(stored?.linkUserId) ? stored.linkUserId : null,
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
			purpose: "login",
		};
		await saveSession(req);
		passport.authenticate("google", {
			scope: ["profile", "email"],
			state,
		})(req, res, next);
	});
}

/** @param {any} passport */
function buildGoogleManagementStartHandler(passport, purpose) {
	return asyncHandler(async (req, res, next) => {
		const principal = /** @type {any} */ (req.user);
		if (principal?.role === "guest" || !Number.isInteger(principal?.id)) {
			respondWithApplicationRecovery(req, res, {
				kind: "forbidden",
				actionHref: "/profile",
			});
			return;
		}
		const methods = await getAuthenticationMethods({ userId: principal.id });
		if (purpose === "link" && methods.google.connected) {
			res.redirect("/profile?googleLink=already-connected");
			return;
		}
		if (
			purpose === "replace" &&
			(!methods.google.connected || !methods.password.connected)
		) {
			res.redirect("/profile?googleLink=replacement-unavailable");
			return;
		}
		const state = randomBytes(32).toString("hex");
		req.session.googleOAuth = {
			state,
			returnTo: "/profile",
			purpose,
			linkUserId: principal.id,
		};
		await saveSession(req);
		passport.authenticate("google", {
			scope: ["profile", "email"],
			state,
			prompt: "select_account",
		})(req, res, next);
	});
}

/** @param {any} passport */
export function buildGoogleLinkStartHandler(passport) {
	return buildGoogleManagementStartHandler(passport, "link");
}

/** @param {any} passport */
export function buildGoogleReplaceStartHandler(passport) {
	return buildGoogleManagementStartHandler(passport, "replace");
}

/** @param {any} passport */
export function buildGoogleCallbackHandler(passport) {
	return asyncHandler(async (req, res, next) => {
		const t = (key, defaultValue) => authMessage(res, key, defaultValue);
		const oauthState = await consumeGoogleOAuthState(req);
		if (!oauthState.valid) {
			renderGoogleFailure(req, res, {
				status: 403,
				message: t(
					"googleVerificationFailed",
					"Google sign-in could not be verified. Please try again.",
				),
			});
			return;
		}
		if (new Set(["link", "replace"]).has(oauthState.purpose)) {
			const principal = /** @type {any} */ (req.user);
			if (
				!principal ||
				principal.id !== oauthState.linkUserId ||
				principal.role === "guest"
			) {
				respondWithApplicationRecovery(req, res, {
					kind: "forbidden",
					actionHref: "/profile",
				});
				return;
			}
			// @ts-ignore -- request-local context consumed by the Google strategy.
			req.googleOAuthContext = {
				userId: principal.id,
				intent: oauthState.purpose,
			};
		} else {
			const principal = /** @type {any} */ (req.user);
			if (principal?.role !== "guest" && principal) {
				respondWithApplicationRecovery(req, res, {
					kind: "forbidden",
					actionHref: "/",
				});
				return;
			}
		}
		if (req.query?.error || typeof req.query?.code !== "string") {
			renderGoogleFailure(req, res, {
				message: t(
					"googleCancelled",
					"Google sign-in was cancelled or could not be completed.",
				),
				returnTo: oauthState.returnTo,
			});
			return;
		}

		passport.authenticate("google", { session: false }, async (error, user) => {
			if (
				error instanceof GoogleIdentityConflictError ||
				error instanceof GoogleProviderAlreadyLinkedError ||
				error instanceof GoogleReplacementUnavailableError
			) {
				res.redirect(
					`/profile?googleLink=${
						error instanceof GoogleIdentityConflictError
							? "conflict"
							: error instanceof GoogleReplacementUnavailableError
								? "replacement-unavailable"
								: "already-connected"
					}`,
				);
				return;
			}
			if (error instanceof GoogleEmailConflictError) {
				renderGoogleFailure(req, res, {
					status: 409,
					message: t(
						"googleEmailConflict",
						"An account with that email address already exists. Sign in using its existing authentication method.",
					),
					returnTo: oauthState.returnTo,
				});
				return;
			}
			if (error instanceof GoogleProfileError && oauthState.purpose !== "login") {
				res.redirect("/profile?googleLink=invalid");
				return;
			}
			if (
				error instanceof GoogleProfileError ||
				error instanceof GuestConversionUnavailableError
			) {
				renderGoogleFailure(req, res, {
					status: 422,
					message:
						error instanceof GuestConversionUnavailableError
							? t(
									"guestConversionUnavailable",
									"The guest workspace is no longer available for conversion.",
								)
							: t(
									"googleProfileInvalid",
									"Google did not provide a valid account profile. Please try again.",
								),
					returnTo: oauthState.returnTo,
				});
				return;
			}
			if (isOAuthProviderError(error)) {
				renderGoogleFailure(req, res, {
					message: t(
						"googleFailed",
						"Google sign-in could not be completed. Please try again.",
					),
					returnTo: oauthState.returnTo,
				});
				return;
			}
			if (error) return next(error);
			if (!user) {
				renderGoogleFailure(req, res, {
					message: t(
						"googleFailed",
						"Google sign-in could not be completed. Please try again.",
					),
					returnTo: oauthState.returnTo,
				});
				return;
			}

			try {
				await establishAuthenticatedSession(req, user, {
					sessionState: user.starterSessionState,
				});
				res.redirect(
					oauthState.purpose !== "login"
						? `/profile?googleLink=${oauthState.purpose === "replace" ? "replaced" : "connected"}`
						: safeReturnTo(oauthState.returnTo),
				);
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
				errors: translateAuthErrors(res, parsed.error.issues),
			});
			return;
		}

		passport.authenticate("local", async (error, user) => {
			if (error) return next(error);
			if (!user) {
				res.status(401);
				renderLogin(req, res, {
					email: parsed.data.email,
					returnTo: parsed.data.returnTo,
					errors: [
						authMessage(res, "invalidCredentials", "Invalid email or password."),
					],
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
			errors: translateAuthErrors(res, parsed.error.issues),
		});
		return;
	}

	try {
		const principal = /** @type {any} */ (req.user);
		const guestUserId =
			principal?.role === "guest" && Number.isInteger(principal.id)
				? principal.id
				: null;
		const user = await registerUser({
			...parsed.data,
			guestUserId,
			sessionState: req.session?.state,
		});
		await establishAuthenticatedSession(req, user, {
			sessionState: user.starterSessionState,
		});
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
				errors: [
					authMessage(
						res,
						"accountExists",
						"An account with that email address already exists.",
					),
				],
			});
			return;
		}
		if (error instanceof GuestConversionUnavailableError) {
			res.status(409);
			renderLogin(req, res, {
				activeTab: "signup",
				email: parsed.data.email,
				returnTo: parsed.data.returnTo,
				errors: [
					authMessage(
						res,
						"guestConversionUnavailable",
						"The guest workspace is no longer available for conversion.",
					),
				],
			});
			return;
		}
		throw error;
	}
}

/** @param {any} req @param {any} res */
async function enterGuest(req, res) {
	const { user: guest, starter } = await createGuest();
	try {
		await establishAuthenticatedSession(req, guest, {
			sessionState: {
				programId: starter.programId,
				cycleId: starter.cycleId,
				dayId: starter.trainingDayId,
			},
		});
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
