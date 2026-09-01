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
		"managementMode",
		"shell",
		"components",
	]);
	assert.equal("layout" in viewModel, false);
	assert.equal(viewModel.components.createSessionForm.form.action, "/sessions");
	assert.equal(viewModel.components.createExerciseForm.modal.id, "createExerciseModal");
});

test("library template renders from its page ViewModel", async () => {
	const viewModel = createLibraryPageViewModel({
		page,
		pageState: { userId: null, sessionId: null },
		data,
	});

	/** @type {(name: string) => string} */
	const contentFor = (name) => `<!-- section:${name} -->`;

	const renderFile =
		/** @type {(filename: string, data: object) => Promise<string>} */ (ejs.renderFile);
	const html = await renderFile(path.resolve("views/library.ejs"), {
		...viewModel,
		contentFor,
		csrfToken: "test-token",
	});

	assert.match(html, /data-library-page/);
	assert.match(html, /data-library-mode="personal"/);
	assert.match(html, /data-create-session-form/);
	assert.match(html, /data-archive-session-form/);
	assert.match(html, /data-variant-create-form/);
	assert.match(html, /Create your variant/);
	assert.match(html, /\/js\/pages\/library\/index\.js/);
});

test("administrator library state is catalog-only and excludes private variants", async () => {
	const adminData = {
		...data,
		user: { id: 1, name: "Admin", role: "admin" },
		exerciseTemplates: [
			{
				id: 1,
				name: "Squat",
				movementPattern: {},
				equipment: {},
				muscles: [],
				variant: { id: 10, name: "Global squat", ownerUserId: null },
			},
			{
				id: 1,
				name: "Squat",
				movementPattern: {},
				equipment: {},
				muscles: [],
				variant: { id: 11, name: "Admin private squat", ownerUserId: 1 },
			},
		],
	};
	const viewModel = createLibraryPageViewModel({
		page,
		pageState: { userId: 1, sessionId: null },
		data: /** @type {any} */ (adminData),
		managementMode: true,
	});
	const renderFile =
		/** @type {(filename: string, data: object) => Promise<string>} */ (ejs.renderFile);
	const html = await renderFile(path.resolve("views/library.ejs"), {
		...viewModel,
		csrfToken: "test-token",
		contentFor: (/** @type {string} */ name) => `<!-- section:${name} -->`,
	});

	assert.equal(viewModel.shell.activeNavigation, "admin-exercises");
	assert.equal(viewModel.components.exerciseTemplates.items.length, 1);
	assert.match(html, /data-library-mode="admin"/);
	assert.match(html, /Global catalog access/);
	assert.match(html, /Create global variant/);
	assert.match(html, /Global squat/);
	assert.doesNotMatch(html, /Admin private squat/);
	assert.doesNotMatch(html, /data-create-session-form/);
	assert.doesNotMatch(html, /data-private-variant-form/);
});

test("invalid update renders submitted values, errors, and the selected modal", async () => {
	const populatedData = {
		...data,
		equipments: [{ id: 3, name: "Barbell" }],
		movementPatterns: [{ id: 2, name: "Push", notes: null }],
		muscles: [
			{
				id: 4,
				commonName: "Chest",
				scientificName: "Pectoralis",
				bodyRegion: "torso",
				referenceUrl: null,
			},
		],
		muscleRoles: [{ id: 1, name: "primary", description: null }],
	};
	const viewModel = createLibraryPageViewModel({
		page,
		pageState: { userId: null, sessionId: null },
		data: /** @type {any} */ (populatedData),
		exerciseTemplateFormState: {
			mode: "update",
			open: true,
			exerciseId: "7",
			variantId: "11",
			values: {
				name: "Submitted press",
				movementPatternId: "2",
				equipmentId: "3",
				muscleGroup: [{ muscleId: "4", muscleRoleId: "1" }],
			},
			errors: { fieldErrors: { name: "Name error" }, formErrors: ["Form error"] },
		},
		managementMode: true,
	});
	const renderFile =
		/** @type {(filename: string, data: object) => Promise<string>} */ (ejs.renderFile);
	const html = await renderFile(path.resolve("views/library.ejs"), {
		...viewModel,
		csrfToken: "test-token",
		contentFor: (/** @type {string} */ name) => `<!-- section:${name} -->`,
	});

	assert.match(html, /data-modal-open-on-load[\s\S]{0,80}id=updateExerciseModal/);
	assert.match(
		html,
		/action="\/admin\/library\/exercises\/7\/variants\/11\?_method=PATCH"/,
	);
	assert.match(html, /value="Submitted press"/);
	assert.match(html, /Name error/);
	assert.match(html, /Form error/);
	assert.match(html, /muscleGroup\[0\]\[muscleId\]/);
});

test("invalid session update preserves its aggregate and reopens the update modal", async () => {
	const populatedData = {
		...data,
		stepTypes: [{ id: 1, name: "Exercise" }],
		exerciseTemplates: [
			{
				id: 2,
				name: "Press",
				movementPattern: {},
				equipment: {},
				muscles: [],
				variant: { id: 4, name: "Press" },
			},
		],
	};
	const viewModel = createLibraryPageViewModel({
		page,
		pageState: { userId: null, sessionId: null },
		data: /** @type {any} */ (populatedData),
		sessionTemplateFormState: {
			mode: "update",
			open: true,
			sessionId: "5",
			values: {
				name: "Submitted session",
				notes: "Keep notes",
				stepRow: [
					{
						stepId: "8",
						stepTypeId: "1",
						exerciseVariantId: "4",
						sets: "3",
						reps: "8",
						loadValue: "20",
						loadUnit: "Kilograms",
					},
				],
			},
			errors: {
				fieldErrors: { name: "Session name error", stepRow: "Step error" },
				formErrors: ["Form error"],
			},
		},
	});
	const renderFile =
		/** @type {(filename: string, data: object) => Promise<string>} */ (ejs.renderFile);
	const html = await renderFile(path.resolve("views/library.ejs"), {
		...viewModel,
		csrfToken: "test-token",
		contentFor: (/** @type {string} */ name) => `<!-- section:${name} -->`,
	});
	assert.match(html, /data-modal-open-on-load[\s\S]{0,80}id=updateSessionModal/);
	assert.match(html, /action="\/sessions\/5\?_method=PATCH"/);
	assert.match(html, /value="Submitted session"/);
	assert.match(html, /Session name error/);
	assert.match(html, /Step error/);
	assert.match(html, /stepRow\[0\]\[stepId\]/);
});
