import asyncHandler from "../../../utils/asyncControllerHandler.js";
import createGuest from "../../features/auth/createGuest.js";
import registerUser from "../../features/auth/registerUser.js";
import * as usersRepository from "../../features/users/repository.js";
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

/** @param {any} req @param {any} res @param {any} next @param {any} user @param {string} returnTo */
function establishSession(req, res, next, user, returnTo) {
	req.session.regenerate((regenerateError) => {
		if (regenerateError) return next(regenerateError);
		req.login(user, (loginError) => {
			if (loginError) return next(loginError);
			req.session.save((saveError) => {
				if (saveError) return next(saveError);
				res.redirect(safeReturnTo(returnTo));
			});
		});
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

		passport.authenticate("local", (error, user, info) => {
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
			establishSession(req, res, next, user, parsed.data.returnTo);
		})(req, res, next);
	};
}

/** @param {any} req @param {any} res @param {any} next */
async function register(req, res, next) {
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
		const user = await registerUser(parsed.data);
		establishSession(req, res, next, user, parsed.data.returnTo);
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
		throw error;
	}
}

/** @param {any} req @param {any} res @param {any} next */
async function enterGuest(req, res, next) {
	const guest = await createGuest();
	req.session.regenerate((regenerateError) => {
		if (regenerateError) {
			usersRepository
				.deleteGuestById({ userId: guest.id })
				.finally(() => next(regenerateError));
			return;
		}
		req.login(guest, (loginError) => {
			if (loginError) {
				usersRepository
					.deleteGuestById({ userId: guest.id })
					.finally(() => next(loginError));
				return;
			}
			req.session.save((saveError) => {
				if (saveError) return next(saveError);
				res.redirect("/");
			});
		});
	});
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
