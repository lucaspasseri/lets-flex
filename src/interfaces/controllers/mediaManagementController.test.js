import assert from "node:assert/strict";
import test from "node:test";

import { createMediaManagementPageFeedback } from "./mediaManagementController.js";

function translate(_key, options = {}) {
	return options.defaultValue ?? "";
}

test("media operation feedback uses explicit success semantics for upload, assignment, and removal", () => {
	const cases = [
		["upload", "The image was uploaded and assigned to this entity."],
		["assign", "The existing media was assigned to this entity."],
		["remove", "The direct media assignment was removed."],
	];

	for (const [operation, message] of cases) {
		const feedback = createMediaManagementPageFeedback(translate, "success", operation);
		assert.deepEqual(
			{ tone: feedback.tone, eyebrow: feedback.eyebrow, message: feedback.message },
			{ tone: "success", eyebrow: "Success", message },
		);
	}
});

test("media validation feedback uses explicit error semantics and never success copy", () => {
	const feedback = createMediaManagementPageFeedback(translate, "error");

	assert.deepEqual(
		{
			tone: feedback.tone,
			eyebrow: feedback.eyebrow,
			title: feedback.title,
			message: feedback.message,
		},
		{
			tone: "error",
			eyebrow: "Action not completed",
			title: "Media could not be updated",
			message: "Review the information and try again.",
		},
	);
	assert.doesNotMatch(feedback.message, /updated|assigned|removed/);
});
