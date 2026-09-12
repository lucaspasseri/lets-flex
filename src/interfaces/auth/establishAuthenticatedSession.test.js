import assert from "node:assert/strict";
import test from "node:test";
import establishAuthenticatedSession from "./establishAuthenticatedSession.js";

test("authenticated session rotation preserves a canonical locale preference", async () => {
	const request = /** @type {any} */ ({
		session: {
			locale: "pt-BR",
			regenerate(callback) {
				this.locale = "";
				callback();
			},
			save(callback) {
				callback();
			},
		},
		login(_user, callback) {
			callback();
		},
	});

	await establishAuthenticatedSession(request, { id: 4 });

	assert.equal(request.session.locale, "pt-BR");
});
