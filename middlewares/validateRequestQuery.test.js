import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import validateRequestQuery from "./validateRequestQuery.js";

test("query middleware stores sanitized parsed data", () => {
	const request = /** @type {*} */ ({
		query: { id: "2", ignored: "value" },
	});
	let continued = false;
	validateRequestQuery(z.object({ id: z.coerce.number().int() }))(
		request,
		/** @type {*} */ ({}),
		() => {
			continued = true;
		},
	);

	assert.deepEqual(request.validatedQuery, { id: 2 });
	assert.equal(continued, true);
});

test("query middleware returns a structured 400 response", () => {
	const request = /** @type {*} */ ({ query: { id: "bad" } });
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

	validateRequestQuery(z.object({ id: z.coerce.number({ error: "Invalid ID." }) }))(
		request,
		response,
		() => assert.fail("must not continue"),
	);

	assert.equal(status, 400);
	assert.equal(body.error, "Invalid query parameters.");
	assert.deepEqual(body.fieldErrors, { id: "Invalid ID." });
});
