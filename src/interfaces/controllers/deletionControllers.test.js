import test from "node:test";
import assert from "node:assert/strict";
import { programsController } from "./programController.js";
import { cycleController } from "./cycleController.js";

function response(/** @type {number | null} */ userId = 1) {
	return {
		locals: { sessionState: { userId } },
		statusCode: null,
		body: null,
		status(code) {
			this.statusCode = code;
			return this;
		},
		send(body) {
			this.body = body;
		},
	};
}

test("program deletion rejects invalid IDs before accessing the database", async () => {
	const res = response();
	await programsController.delete(
		{ params: { programId: "not-an-id" } },
		res,
		assert.fail,
	);
	assert.equal(res.statusCode, 400);
	assert.equal(res.body, "Invalid program ID");
});

test("cycle deletion rejects invalid IDs before accessing the database", async () => {
	const res = response();
	await cycleController.delete({ params: { cycleId: "0" } }, res, assert.fail);
	assert.equal(res.statusCode, 400);
	assert.equal(res.body, "Invalid cycle ID");
});

test("deletion requires an active profile", async () => {
	const programResponse = response(null);
	const cycleResponse = response(null);
	await programsController.delete(
		{ params: { programId: "1" } },
		programResponse,
		assert.fail,
	);
	await cycleController.delete(
		{ params: { cycleId: "1" } },
		cycleResponse,
		assert.fail,
	);
	assert.equal(programResponse.statusCode, 403);
	assert.equal(cycleResponse.statusCode, 403);
});
