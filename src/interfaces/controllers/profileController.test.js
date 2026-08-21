import test from "node:test";
import assert from "node:assert/strict";
import { profileController } from "./profileController.js";

test("clearing profile selection preserves unrelated session state", () => {
	const request = /** @type {*} */ ({
		session: {
			state: { userId: 2, programId: 7 },
		},
	});
	let redirectPath = null;
	const response = /** @type {*} */ ({
		redirect(path) {
			redirectPath = path;
		},
	});

	profileController.clearSelection(request, response);

	assert.deepEqual(request.session.state, { programId: 7 });
	assert.equal(redirectPath, "/profile");
});
