import test from "node:test";
import assert from "node:assert/strict";
import { buildCreateUserHandler } from "./userController.js";

test("create user controller uses only validated input on the successful path", async () => {
	const validatedBody = {
		name: "Ada Lovelace",
		dateOfBirth: "1815-12-10",
		anamnesis: null,
	};
	const request = /** @type {*} */ ({
		body: { name: "untrusted raw value" },
		validatedBody,
		session: { state: { previous: true } },
	});
	let receivedInput;
	let redirectPath;
	const handler = buildCreateUserHandler(async input => {
		receivedInput = input;
		return { id: 42 };
	});

	await handler(request, /** @type {*} */ ({
		/** @param {string} path */
		redirect(path) { redirectPath = path; },
	}));

	assert.equal(receivedInput, validatedBody);
	assert.deepEqual(request.session.state, { userId: 42 });
	assert.equal(redirectPath, "/profile");
});
