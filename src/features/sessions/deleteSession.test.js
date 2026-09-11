import test from "node:test";
import assert from "node:assert/strict";
import deleteSession, { SessionTemplateNotDeletableError } from "./deleteSession.js";

test("delete session delegates the owner-scoped identity and returns the archive outcome", async () => {
	let received;
	const result = await deleteSession(
		{ sessionId: 7, ownerUserId: 3 },
		/** @type {any} */ ({
			async deleteOrArchive(input) {
				received = input;
				return "archived";
			},
		}),
	);

	assert.deepEqual(received, { sessionId: 7, ownerUserId: 3 });
	assert.equal(result, "archived");
});

test("delete session preserves the referenced-session archive outcome", async () => {
	const result = await deleteSession(
		{ sessionId: 7, ownerUserId: 3 },
		/** @type {any} */ ({
			async deleteOrArchive() {
				return "archived";
			},
		}),
	);

	assert.equal(result, "archived");
});

test("delete session reports an unavailable or unowned template", async () => {
	await assert.rejects(
		deleteSession(
			{ sessionId: 99, ownerUserId: 3 },
			/** @type {any} */ ({
				async deleteOrArchive() {
					return null;
				},
			}),
		),
		SessionTemplateNotDeletableError,
	);
});
