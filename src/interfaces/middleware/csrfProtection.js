import { randomBytes, timingSafeEqual } from "node:crypto";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** @param {unknown} actual @param {unknown} expected */
function tokensMatch(actual, expected) {
	if (typeof actual !== "string" || typeof expected !== "string") return false;
	const actualBuffer = Buffer.from(actual);
	const expectedBuffer = Buffer.from(expected);
	return (
		actualBuffer.length === expectedBuffer.length &&
		timingSafeEqual(actualBuffer, expectedBuffer)
	);
}

/** @type {import("express").RequestHandler} */
export default function csrfProtection(req, res, next) {
	// @ts-ignore -- application session extension.
	req.session.csrfToken ??= randomBytes(32).toString("hex");
	// @ts-ignore -- application session extension.
	res.locals.csrfToken = req.session.csrfToken;

	if (SAFE_METHODS.has(req.method)) {
		next();
		return;
	}

	// @ts-ignore -- application session extension.
	if (!tokensMatch(req.body?._csrf, req.session.csrfToken)) {
		res.status(403).send("Invalid CSRF token");
		return;
	}
	next();
}
