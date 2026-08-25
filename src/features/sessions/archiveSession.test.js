import test from "node:test";
import assert from "node:assert/strict";
import archiveSession, { SessionTemplateNotArchivableError } from "./archiveSession.js";

test("archive session delegates the selected identity to the repository", async () => {
	let received;
	await archiveSession(
		7,
		/** @type {any} */ ({
			async archive(/** @type {any} */ input) {
				received = input;
				return true;
			},
		}),
	);
	assert.deepEqual(received, { sessionId: 7 });
});

test("archive session reports a missing or already archived template", async () => {
	await assert.rejects(
		archiveSession(
			99,
			/** @type {any} */ ({
				async archive() {
					return false;
				},
			}),
		),
		SessionTemplateNotArchivableError,
	);
});
