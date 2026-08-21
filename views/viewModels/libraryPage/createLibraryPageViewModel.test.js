import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import ejs from "ejs";
import createLibraryPageViewModel from "./createLibraryPageViewModel.js";

const page = {
	path: "/library",
	url: "/library",
	backUrl: "/",
	backUrlWithoutParams: "/",
	title: "Library",
};

const data = {
	user: null,
	activeSession: null,
	sessions: [],
	equipments: [],
	movementPatterns: [],
	muscles: [],
	muscleRoles: [],
	exerciseTemplates: [],
	stepTypes: [],
};

test("library page exposes one explicit component contract", () => {
	const viewModel = createLibraryPageViewModel({
		page,
		pageState: { userId: null, sessionId: null },
		data,
	});

	assert.deepEqual(Object.keys(viewModel), [
		"page",
		"pageState",
		"shell",
		"components",
	]);
	assert.equal("layout" in viewModel, false);
	assert.equal(
		viewModel.components.createSessionForm.form.action,
		"/sessions",
	);
	assert.equal(
		viewModel.components.createExerciseForm.modal.id,
		"createExerciseModal",
	);
});

test("library template renders from its page ViewModel", async () => {
	const viewModel = createLibraryPageViewModel({
		page,
		pageState: { userId: null, sessionId: null },
		data,
	});

	/** @type {(name: string) => string} */
	const contentFor = name => `<!-- section:${name} -->`;

	const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
		ejs.renderFile
	);
	const html = await renderFile(
		path.resolve("views/library.ejs"),
		{
			...viewModel,
			contentFor,
		},
	);

	assert.match(html, /data-library-page/);
	assert.match(html, /data-create-session-form/);
	assert.match(html, /\/js\/pages\/library\/index\.js/);
});
