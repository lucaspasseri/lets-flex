import { safeReturnTo } from "../validation/authSchemas.js";

/** @param {import("express").Request} req */
function safeRefererPath(req) {
	const referer = req.get("Referer");
	if (!referer) return "/";

	try {
		const parsed = new URL(referer);
		if (parsed.host !== req.get("host")) return "/";
		return `${parsed.pathname}${parsed.search}${parsed.hash}`;
	} catch {
		return "/";
	}
}

/** @param {import("express").Request} req @param {import("express").Response} res @param {import("express").NextFunction} next */
function setLocale(req, res, next) {
	// @ts-ignore -- validated by localeSelectionSchema before this controller.
	const { locale, returnTo } = req.validatedBody;
	// @ts-ignore -- application-owned locale preference stored in the session.
	req.session.locale = locale;
	req.session.save((error) => {
		if (error) {
			next(error);
			return;
		}
		res.redirect(safeReturnTo(returnTo || safeRefererPath(req)));
	});
}

export const localeController = { set: setLocale };
