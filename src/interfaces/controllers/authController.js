import asyncHandler from "../../../utils/asyncControllerHandler.js";
import createGuest from "../../features/auth/createGuest.js";
import registerUser, {
	GuestConversionUnavailableError,
} from "../../features/auth/registerUser.js";
import * as usersRepository from "../../features/users/repository.js";
import establishAuthenticatedSession from "../auth/establishAuthenticatedSession.js";
import {
	loginSchema,
	registrationSchema,
	safeReturnTo,
} from "../validation/authSchemas.js";

/** @param {any} req @param {any} res @param {Record<string, any>} [state] */
function renderLogin(req, res, state = {}) {
	res.render("login", {
		layout: "./layouts/authShell",
		page: { title: "Sign in · Let's Flex!" },
		returnTo: safeReturnTo(state.returnTo ?? req.query?.returnTo),
		email: state.email ?? "",
		errors: state.errors ?? [],
		activeTab: state.activeTab ?? (req.query?.tab === "signup" ? "signup" : "signin"),
	});
}

/** @param {any} req @param {any} res */
function show(req, res) {
	renderLogin(req, res);
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
