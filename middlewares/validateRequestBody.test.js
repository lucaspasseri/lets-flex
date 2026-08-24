import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import validateRequestBody from "./validateRequestBody.js";

test("valid body middleware stores parsed data and continues", async () => {
	const request = /** @type {*} */ ({ body: { name: "  Ada  ", ignored: "value" } });
	let continued = false;
	let invalidCalled = false;
	const middleware = validateRequestBody(
		z.object({ name: z.string().trim() }),
		() => { invalidCalled = true; },
	);

	await middleware(request, /** @type {*} */ ({}), () => { continued = true; });

	assert.deepEqual(request.validatedBody, { name: "Ada" });
	assert.equal(continued, true);
	assert.equal(invalidCalled, false);
});

test("invalid body middleware delegates a stable error shape and preserves values", async () => {
	const request = /** @type {*} */ ({ body: { name: "", notes: "keep me" } });
	let continued = false;
	let invalidResult;
	const middleware = validateRequestBody(
		z.object({ name: z.string().min(1, "Enter a name.") }),
		(_req, _res, result) => { invalidResult = result; },
	);

	await middleware(request, /** @type {*} */ ({}), () => { continued = true; });

	assert.equal(continued, false);
	assert.deepEqual(invalidResult, {
		errors: {
			fieldErrors: { name: "Enter a name." },
			formErrors: [],
		},
		submittedValues: request.body,
	});
});
