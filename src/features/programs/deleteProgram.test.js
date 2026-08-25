import test from "node:test";
import assert from "node:assert/strict";
import deleteProgram, { ProgramNotFoundError } from "./deleteProgram.js";

test("deleteProgram scopes deletion to the program and active user", async () => {
	let received;
	const deleted = await deleteProgram(
		{ programId: 4, userId: 2 },
		{
			async deleteByIdForUser(input) {
				received = input;
				return { id: 4 };
			},
		},
	);
	assert.deepEqual(received, { programId: 4, userId: 2 });
	assert.equal(deleted.id, 4);
});

test("deleteProgram treats missing and unowned programs alike", async () => {
	await assert.rejects(
		deleteProgram(
			{ programId: 4, userId: 9 },
			{
				async deleteByIdForUser() {
					return null;
				},
			},
		),
		ProgramNotFoundError,
	);
});

test("deleteProgram preserves database failures", async () => {
	const failure = new Error("database unavailable");
	await assert.rejects(
		deleteProgram(
			{ programId: 4, userId: 2 },
			{
				async deleteByIdForUser() {
					throw failure;
				},
			},
		),
		(error) => error === failure,
	);
});
