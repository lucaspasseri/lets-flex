import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import validateRequestParams from "./validateRequestParams.js";

test("params middleware stores sanitized parsed data", () => {
	const request = /** @type {*} */ ({ params: { id: "12", ignored: "value" } });
	let continued = false;
	validateRequestParams(z.object({ id: z.coerce.number().int().positive() }))(
		request,
		/** @type {*} */ ({}),
		() => (continued = true),
	);

	assert.deepEqual(request.validatedParams, { id: 12 });
	assert.equal(continued, true);
});

test("params middleware rejects malformed identifiers with field errors", () => {
	const request = /** @type {*} */ ({ params: { id: "not-an-id" } });
	let status;
	let body;
	const response = /** @type {*} */ ({
		status(value) {
			status = value;
			return this;
		},
		json(value) {
			body = value;
		},
	});

	validateRequestParams(
		z.object({ id: z.coerce.number({ error: "Choose a valid ID." }) }),
	)(request, response, () => assert.fail("must not continue"));

	assert.equal(status, 400);
	assert.equal(body.error, "Invalid route parameters.");
	assert.deepEqual(body.fieldErrors, { id: "Choose a valid ID." });
});
