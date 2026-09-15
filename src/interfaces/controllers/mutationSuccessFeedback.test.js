import assert from "node:assert/strict";
import test from "node:test";

import createMutationSuccessFeedback from "./mutationSuccessFeedback.js";
import { createLibrarySuccessFeedback } from "./libraryController.js";
import { createProgramsSuccessFeedback } from "./programController.js";

const messages = {
	created: {
		titleKey: "mutation.created",
		title: "Created",
		messageKey: "mutation.createdMessage",
		message: "The item is ready.",
	},
};

const translate = (_key, options = {}) => options.defaultValue;

test("successful mutation feedback is explicit and rejects unknown operations", () => {
	assert.deepEqual(
		createMutationSuccessFeedback(translate, "created", messages, "feedback-title"),
		{
			tone: "success",
			id: "feedback-title",
			eyebrow: "Success",
			title: "Created",
			message: "The item is ready.",
		},
	);
	assert.equal(
		createMutationSuccessFeedback(translate, "not-allowed", messages, "feedback-title"),
		null,
	);
});

test("Library and Programs expose contextual copy for successful redirects", () => {
	const libraryFeedback = createLibrarySuccessFeedback(translate, "variant-updated");
	const programsFeedback = createProgramsSuccessFeedback(translate, "cycle-created");

	assert.equal(libraryFeedback?.tone, "success");
	assert.equal(libraryFeedback?.title, "Variant updated");
	assert.match(libraryFeedback?.message ?? "", /saved/);
	assert.equal(programsFeedback?.tone, "success");
	assert.equal(programsFeedback?.title, "Cycle created");
	assert.match(programsFeedback?.message ?? "", /training days/);
});
