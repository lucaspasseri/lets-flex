import { isSupportedLocale } from "../../infrastructure/i18n/i18n.js";

/**
 * Rotates the session before serializing an authenticated application user.
 * Local registration/login and future provider callbacks share this boundary.
 * @param {import("express").Request} req
 * @param {any} user
 * @param {{sessionState?: Record<string, unknown>}} [options]
 */
export default async function establishAuthenticatedSession(req, user, options = {}) {
	// @ts-ignore -- application-owned locale preference stored in the session.
	const previousLocale = req.session.locale;
	await new Promise((resolve, reject) => {
		req.session.regenerate((error) => (error ? reject(error) : resolve(undefined)));
	});
	await new Promise((resolve, reject) => {
		req.login(user, (error) => (error ? reject(error) : resolve(undefined)));
	});
	if (options.sessionState) {
		// @ts-ignore -- application-owned selection state stored in the session.
		req.session.state = { ...options.sessionState };
	}
	if (isSupportedLocale(previousLocale)) {
		// @ts-ignore -- application-owned locale preference stored in the session.
		req.session.locale = previousLocale;
	}
	await new Promise((resolve, reject) => {
		req.session.save((error) => (error ? reject(error) : resolve(undefined)));
	});
}
