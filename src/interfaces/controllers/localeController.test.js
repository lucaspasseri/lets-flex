import assert from "node:assert/strict";
import test from "node:test";
import { localeController } from "./localeController.js";

test("locale selection persists the canonical locale and redirects locally", () => {
	const request = /** @type {any} */ ({
		validatedBody: { locale: "pt-BR", returnTo: "/library?sessionId=4" },
		session: {
			save(callback) {
				callback();
			},
		},
	});
	const response = /** @type {any} */ ({
		redirectedTo: null,
		redirect(value) {
			this.redirectedTo = value;
		},
	});

	localeController.set(request, response, () => {});

	assert.equal(request.session.locale, "pt-BR");
	assert.equal(response.redirectedTo, "/library?sessionId=4");
});

test("locale selection rejects external redirect targets", () => {
	const request = /** @type {any} */ ({
		validatedBody: { locale: "en", returnTo: "https://example.com" },
		session: {
			save(callback) {
				callback();
			},
		},
	});
	const response = /** @type {any} */ ({
		redirect(value) {
			this.redirectedTo = value;
		},
	});

	localeController.set(request, response, () => {
		throw new Error("session save should not fail");
	});

	assert.equal(response.redirectedTo, "/");
});

test("locale selection uses a same-origin referrer when no return path is posted", () => {
	const request = /** @type {any} */ ({
		validatedBody: { locale: "pt-BR", returnTo: "" },
		session: {
			save(callback) {
				callback();
			},
		},
		get(name) {
			return name === "Referer"
				? "https://lets-flex.test/library?sessionId=4"
				: "lets-flex.test";
		},
	});
	const response = /** @type {any} */ ({
		redirect(value) {
			this.redirectedTo = value;
		},
	});

	localeController.set(request, response, () => {});

	assert.equal(response.redirectedTo, "/library?sessionId=4");
});
