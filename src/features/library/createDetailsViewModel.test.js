import test from "node:test";
import assert from "node:assert/strict";
import createDetails from "./createDetailsViewModel.js";

/** @param {boolean} isArchived */
function session(isArchived) {
	return {
		id: 7,
		name: "Upper body",
		notes: "",
		isArchived,
		ownerUserId: 3,
		steps: [],
	};
}

test("active owned session details expose a presentation-safe delete action", () => {
	const details = createDetails({ session: session(false), actorUserId: 3 });
	assert.ok(details);
	assert.deepEqual(details.actions.delete, {
		label: "Delete session",
		modalId: "deleteSessionModal",
		values: { sessionId: 7, name: "Upper body" },
	});
});

test("archived session details do not offer the delete action again", () => {
	const details = createDetails({ session: session(true), actorUserId: 3 });
	assert.ok(details);
	assert.equal(details.actions.delete, null);
});
