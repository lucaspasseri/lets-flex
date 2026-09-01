/**
 * Rotates the session before serializing an authenticated application user.
 * Local registration/login and future provider callbacks share this boundary.
 * @param {import("express").Request} req
 * @param {any} user
 */
export default async function establishAuthenticatedSession(req, user) {
	await new Promise((resolve, reject) => {
		req.session.regenerate((error) => (error ? reject(error) : resolve(undefined)));
	});
	await new Promise((resolve, reject) => {
		req.login(user, (error) => (error ? reject(error) : resolve(undefined)));
	});
	await new Promise((resolve, reject) => {
		req.session.save((error) => (error ? reject(error) : resolve(undefined)));
	});
}
