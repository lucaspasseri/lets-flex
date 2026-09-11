import test from "node:test";
import assert from "node:assert/strict";
import respondWithContextualMutationError from "./contextualMutationError.js";

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
		viewRendered: false,
		status(statusCode) {
			this.statusCode = statusCode;
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

test("HTML mutation failures render the supplied page context", async () => {
	const response = createResponse();
	let renderCount = 0;

	await respondWithContextualMutationError(
		createRequest({ accept: "text/html" }),
		response,
		{
			status: 409,
			fallbackMessage: "Variant already exists.",
			render: () => {
				renderCount += 1;
				response.viewRendered = true;
			},
		},
	);

	assert.equal(response.statusCode, 409);
	assert.equal(renderCount, 1);
	assert.equal(response.viewRendered, true);
	assert.equal(response.body, null);
});

test("JSON mutation failures retain the API error shape without rendering", async () => {
	const response = createResponse();
	let renderCount = 0;

	await respondWithContextualMutationError(
		createRequest({ accept: "application/json" }),
		response,
		{
			status: 404,
			fallbackMessage: "Variant not found.",
			render: () => {
				renderCount += 1;
			},
		},
	);

	assert.equal(response.statusCode, 404);
	assert.deepEqual(response.body, { error: "Variant not found." });
	assert.equal(renderCount, 0);
});

test("unnegotiated mutation failures retain the plain fallback", async () => {
	const response = createResponse();

	await respondWithContextualMutationError(createRequest(), response, {
		status: 400,
		fallbackMessage: "Invalid variant identifier.",
		render: () => {},
	});

	assert.equal(response.statusCode, 400);
	assert.equal(response.body, "Invalid variant identifier.");
});
