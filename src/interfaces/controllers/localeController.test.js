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

test("locale selection preserves nested resource paths and their query string", () => {
	const request = /** @type {any} */ ({
		validatedBody: {
			locale: "pt-BR",
			returnTo: "/programs/12/cycles/4/day/8?sessionId=3",
		},
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

	localeController.set(request, response, () => {});

	assert.equal(request.session.locale, "pt-BR");
	assert.equal(response.redirectedTo, "/programs/12/cycles/4/day/8?sessionId=3");
});

test("locale selection rejects external redirect targets", () => {
	for (const returnTo of ["https://example.com", "//evil.example", "/\\evil.example"]) {
		const request = /** @type {any} */ ({
			validatedBody: { locale: "en", returnTo },
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
	}
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

test("locale selection falls back to the dashboard route when no safe path is available", () => {
	const request = /** @type {any} */ ({
		validatedBody: { locale: "pt-BR", returnTo: "" },
		session: {
			save(callback) {
				callback();
			},
		},
		get() {
			return undefined;
		},
	});
	const response = /** @type {any} */ ({
		redirect(value) {
			this.redirectedTo = value;
		},
	});

	localeController.set(request, response, () => {});

	assert.equal(request.session.locale, "pt-BR");
	assert.equal(response.redirectedTo, "/");
});
