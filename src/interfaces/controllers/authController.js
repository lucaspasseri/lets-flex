import asyncHandler from "../../../utils/asyncControllerHandler.js";
import createGuest from "../../features/auth/createGuest.js";
import * as usersRepository from "../../features/users/repository.js";
import { loginSchema, safeReturnTo } from "../validation/authSchemas.js";

/** @param {any} req @param {any} res @param {Record<string, any>} [state] */
function renderLogin(req, res, state = {}) {
	res.render("login", {
		layout: "./layouts/authShell",
		page: { title: "Sign in · Let's Flex!" },
		returnTo: safeReturnTo(state.returnTo ?? req.query?.returnTo),
		email: state.email ?? "",
		errors: state.errors ?? [],
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
			req.session.regenerate((regenerateError) => {
				if (regenerateError) return next(regenerateError);
				req.login(user, (loginError) => {
					if (loginError) return next(loginError);
					req.session.save((saveError) => {
						if (saveError) return next(saveError);
						res.redirect(safeReturnTo(parsed.data.returnTo));
					});
				});
			});
		})(req, res, next);
	};
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
	enterGuest: asyncHandler(enterGuest),
	logout,
};
