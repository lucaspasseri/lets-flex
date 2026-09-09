/**
 * Rotates the session before serializing an authenticated application user.
 * Local registration/login and future provider callbacks share this boundary.
 * @param {import("express").Request} req
 * @param {any} user
 * @param {{sessionState?: Record<string, unknown>}} [options]
 */
export default async function establishAuthenticatedSession(req, user, options = {}) {
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
	await new Promise((resolve, reject) => {
		req.session.save((error) => (error ? reject(error) : resolve(undefined)));
	});
}
