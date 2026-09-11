import { respondWithApplicationRecovery } from "../applicationRecovery.js";

/** @type {import("express").RequestHandler} */
export function requireAuthentication(req, res, next) {
	if (req.isAuthenticated?.() && req.user) {
		next();
		return;
	}
	const returnTo = req.method === "GET" ? req.originalUrl : "/";
	res.redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
}

/** @type {import("express").RequestHandler} */
export function requireAnonymous(req, res, next) {
	if (req.isAuthenticated?.()) {
		res.redirect("/");
		return;
	}
	return next();
}

/** @type {import("express").RequestHandler} */
export function requireAnonymousOrGuest(req, res, next) {
	// @ts-ignore -- application Passport principal.
	if (!req.isAuthenticated?.() || req.user?.role === "guest") {
		next();
		return;
	}
	res.redirect("/");
}

/** @type {import("express").RequestHandler} */
export function requireAdmin(req, res, next) {
	if (!req.isAuthenticated?.() || !req.user) {
		respondWithApplicationRecovery(req, res, { kind: "authentication" });
		return;
	}
	// @ts-ignore -- application Passport principal.
	if (req.user.role !== "admin") {
		respondWithApplicationRecovery(req, res, { kind: "forbidden" });
		return;
	}
	next();
}

/** @type {import("express").RequestHandler} */
export function exposePrincipal(req, res, next) {
	res.locals.authUser = req.user ?? null;
	res.locals.isAdmin = Boolean(
		// @ts-ignore -- application Passport principal.
		req.user?.role === "admin",
	);
	return next();
}
