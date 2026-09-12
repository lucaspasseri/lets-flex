import test from "node:test";
import assert from "node:assert/strict";
import { respondWithApplicationRecovery } from "./applicationRecovery.js";

function createRequest({ accept = "", contentType = "" } = {}) {
	return /** @type {import("express").Request} */ ({
		get(name) {
			return name === "accept" ? accept : "";
		},
		is(type) {
			return type === "json" && contentType === "application/json";
		},
	});
}

function createResponse() {
	return /** @type {any} */ ({
		statusCode: 200,
		body: null,
		view: null,
		data: null,
		status(statusCode) {
			this.statusCode = statusCode;
			return this;
		},
		render(view, data) {
			this.view = view;
			this.data = data;
			return this;
		},
		json(body) {
			this.body = body;
			return this;
		},
		send(body) {
			this.body = body;
			return this;
		},
	});
}

test("HTML requests receive a generic recovery view with a safe action", () => {
	const response = createResponse();

	respondWithApplicationRecovery(createRequest({ accept: "text/html" }), response, {
		kind: "csrf",
	});

	assert.equal(response.statusCode, 403);
	assert.equal(response.view, "application-recovery");
	assert.equal(response.data.layout, "./layouts/recoveryShell");
	assert.equal(response.data.recovery.actionHref, "/");
	assert.match(response.data.recovery.message, /return to the page/i);
	assert.equal(response.body, null);
});

test("JSON requests retain an API-shaped error response", () => {
	const response = createResponse();

	respondWithApplicationRecovery(
		createRequest({ accept: "application/json" }),
		response,
		{ kind: "notFound" },
	);

	assert.equal(response.statusCode, 404);
	assert.deepEqual(response.body, { error: "Not found" });
	assert.equal(response.view, null);
});

test("a JSON content type takes precedence over an HTML accept header", () => {
	const response = createResponse();

	respondWithApplicationRecovery(
		createRequest({ accept: "text/html", contentType: "application/json" }),
		response,
		{ kind: "server" },
	);

	assert.deepEqual(response.body, { error: "Something broke!" });
	assert.equal(response.view, null);
});

test("callers without a negotiated format retain the plain fallback", () => {
	const response = createResponse();

	respondWithApplicationRecovery(createRequest(), response, { kind: "rateLimit" });

	assert.equal(response.statusCode, 429);
	assert.equal(response.body, "Too many requests. Try again later.");
});

test("recovery responses translate application-owned state for the active locale", () => {
	const response = createResponse();
	const request = createRequest({ accept: "text/html" });
	request.res = undefined;
	response.locals = {
		t(key, options) {
			const translations = {
				"recovery.pageNotFoundTitle": "Essa página não está aqui",
				"recovery.pageNotFound": "Página não encontrada",
			};
			return translations[key] ?? options.defaultValue;
		},
	};

	respondWithApplicationRecovery(request, response, { kind: "notFound" });

	assert.equal(response.data.recovery.title, "Essa página não está aqui");
	assert.equal(response.data.recovery.eyebrow, "Página não encontrada");
});
