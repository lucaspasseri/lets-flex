import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import ejs from "ejs";
import createLibraryPageViewModel from "./createLibraryPageViewModel.js";
import { i18n } from "../../../src/infrastructure/i18n/i18n.js";

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

test("Library discovery presentation does not fall back to English in Portuguese", () => {
	const viewModel = createLibraryPageViewModel({
		page,
		pageState: { userId: null, sessionId: null },
		data,
		translate: i18n.getFixedT("pt-BR"),
		language: "pt-BR",
	});

	assert.equal(viewModel.components.sessionWorkspace.heading, "Modelos de sessão");
	assert.equal(
		viewModel.components.sessionWorkspace.discovery.title,
		"Encontre uma sessão",
	);
	assert.equal(
		viewModel.components.sessionWorkspace.discovery.searchLabel,
		"Pesquisar sessões",
	);
	assert.equal(viewModel.components.exerciseTemplates.label, "Exercícios disponíveis");
	assert.equal(
		viewModel.components.exerciseTemplates.discovery.title,
		"Encontre um exercício",
	);
	assert.equal(
		viewModel.components.exerciseTemplates.emptyState.title,
		"Ainda não há modelos de exercício",
	);
	assert.equal(viewModel.components.privateVariantForm.title, "Crie sua variante");
	assert.equal(
		viewModel.components.privateVariantForm.submitLabel,
		"Criar variante privada",
	);
	assert.equal(
		viewModel.components.createExerciseForm.form.heading,
		"Criar modelo de exercício",
	);
	assert.equal(
		viewModel.components.createExerciseForm.actions.addMuscle.label,
		"Adicionar músculo",
	);
});

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
	assert.match(html, /role="tablist" aria-label="Library content"/);
	assert.match(html, /id="library-sessions-tab"[\s\S]*aria-selected="true"/);
	assert.match(html, /id="library-exercises-tab"[\s\S]*aria-selected="false"/);
	assert.match(html, /data-library-section-tabs/);
	assert.match(html, /id="library-exercises-panel"/);
	assert.doesNotMatch(html, /id="library-exercises-panel"[^>]*hidden/);
	assert.equal((html.match(/data-library-query/g) ?? []).length, 2);
	assert.match(html, /data-create-session-form/);
	assert.match(html, /data-delete-session-form/);
	assert.match(html, /data-variant-create-form/);
	assert.match(html, /Create your variant/);
	assert.match(html, /exercise-templates-empty-state/);
	assert.match(html, /No exercise templates yet/);
	assert.match(html, /\/js\/pages\/library\/index\.js/);
});

test("contextual Library entry explains the destination and opens the existing builder", async () => {
	const contextualData = {
		...data,
		user: { id: 7, name: "Member", role: "user" },
		sessionCreationContext: {
			program: {
				id: 3,
				userId: 7,
				goalId: null,
				name: "Strength plan",
				startDate: "2026-09-01",
			},
			cycle: {
				id: 4,
				programId: 3,
				name: "Foundation",
				size: 2,
				order: 1,
			},
			day: {
				id: 5,
				cycleId: 4,
				programId: 3,
				cycleOrder: 1,
				dayOrder: 2,
				scheduledDate: "2026-09-02",
				label: "Lower body",
			},
		},
	};
	const viewModel = createLibraryPageViewModel({
		page,
		pageState: { userId: 7, sessionId: null, sessionCreationDayId: 5 },
		data: /** @type {any} */ (contextualData),
	});
	const renderFile = /** @type {(name: string, data: object) => Promise<string>} */ (
		ejs.renderFile
	);
	const html = await renderFile(path.resolve("views/library.ejs"), {
		...viewModel,
		contentFor: () => "",
		csrfToken: "test-token",
	});

	assert.equal(viewModel.components.planningContext.isVisible, true);
	assert.equal(viewModel.components.createSessionForm.modal.openOnLoad, true);
	assert.equal(viewModel.components.createSessionForm.fields.contextDayId, 5);
	assert.match(html, /Training day context/);
	assert.match(html, /Strength plan · Foundation · Lower body/);
	assert.match(html, /Create and return/);
	assert.match(html, /name="contextDayId" value="5"/);
	assert.match(html, /Return destination/);
	assert.match(html, /Create a session for Lower body/);
	assert.match(html, /href="\/programs\/day\?dayId=5"/);
	assert.match(html, /data-modal-open-on-load/);
});

test("personal exercise markup identifies private scope and retains owner actions", async () => {
	const personalData = {
		...data,
		user: { id: 7, name: "Member", role: "user" },
		exerciseTemplates: [
			{
				id: 3,
				name: "Squat",
				movementPattern: { id: 2, name: "Squat", notes: "Knee dominant" },
				equipment: { id: 2, name: "Barbell", category: "Free weight" },
				muscles: [],
				variant: {
					id: 10,
					name: "Barbell Back Squat",
					setupDescription: "Set the bar across the upper back.",
					environment: "Gym",
					notes: "Use safety arms.",
					ownerUserId: null,
					isArchived: false,
				},
			},
			{
				id: 3,
				name: "Squat",
				movementPattern: { id: 2, name: "Squat", notes: "Knee dominant" },
				equipment: { id: 4, name: "Dumbbell", category: "Free weight" },
				muscles: [],
				variant: {
					id: 12,
					name: "Tempo Goblet Squat",
					setupDescription: "Use a controlled lowering phase.",
					environment: "Home",
					notes: "",
					ownerUserId: 7,
					isArchived: false,
				},
			},
		],
	};
	const viewModel = createLibraryPageViewModel({
		page,
		pageState: { userId: 7, sessionId: null },
		data: /** @type {any} */ (personalData),
	});
	const renderFile =
		/** @type {(filename: string, data: object) => Promise<string>} */ (ejs.renderFile);
	const html = await renderFile(path.resolve("views/library.ejs"), {
		...viewModel,
		csrfToken: "test-token",
		contentFor: (/** @type {string} */ name) => `<!-- section:${name} -->`,
	});

	assert.equal(viewModel.components.exerciseTemplates.items.length, 1);
	assert.equal(viewModel.components.exerciseTemplates.count, 1);
	assert.equal(viewModel.components.exerciseTemplates.variantCount, 2);
	assert.equal(viewModel.components.createSessionForm.fields.exerciseOptions.length, 2);
	assert.equal(viewModel.components.updateSessionForm.fields.exerciseOptions.length, 2);
	assert.match(html, /Base exercise[\s\S]*Squat/);
	assert.match(html, /1 exercise · 2 variants/);
	assert.match(html, /2 variants/);
	assert.match(html, /Barbell Back Squat/);
	assert.match(html, /Tempo Goblet Squat[\s\S]*Private/);
	assert.match(html, /class="[^"]*exercise-template__summary-media[^"]*"/);
	assert.doesNotMatch(html, /<img[\s\S]*\/media\//);
	assert.match(
		html,
		/exercise-template__summary-media media-frame media-frame--initial/,
	);
	assert.equal(
		(html.match(/class="[^"]*exercise-variant__media[^"]*"/g) ?? []).length,
		2,
	);
	assert.match(html, /exercise-variant__media media-frame media-frame--initial/);
	assert.equal((html.match(/id="exercise-template-3-trigger"/g) ?? []).length, 1);
	assert.equal((html.match(/data-exercise-variant-id=/g) ?? []).length, 2);
	assert.equal((html.match(/data-exercise-variant-item/g) ?? []).length, 2);
	assert.match(html, /data-base-search-key-word="Squat Squat Knee dominant"/);
	assert.match(html, /data-filter-values=/);
	assert.match(html, /Search exercises/);
	assert.match(html, /No exercises match these filters/);
	assert.match(html, /action="\/exercise-variants\/12\?_method=PATCH"/);
	assert.match(html, /Archive private variant/);
	assert.doesNotMatch(html, /data-update-exercise-template/);
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
				equipment: { id: 4, name: "Dumbbell" },
				muscles: [],
				variant: { id: 12, name: "Global dumbbell squat", ownerUserId: null },
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
	assert.doesNotMatch(html, /role="tablist" aria-label="Library content"/);
	assert.equal((html.match(/data-library-query/g) ?? []).length, 1);
	assert.match(html, /Global catalog access/);
	assert.match(html, /Create global variant/);
	assert.match(html, /Global squat/);
	assert.match(html, /Global dumbbell squat/);
	assert.match(html, /href="\/admin\/translations\/exercise\/1"/);
	assert.match(html, /href="\/admin\/translations\/exercise_variant\/10"/);
	assert.doesNotMatch(html, /href="\/admin\/translations\/exercise_variant\/11"/);
	assert.match(html, /Base exercise/);
	assert.match(html, /Squat/);
	assert.match(html, /1 exercise · 2 variants/);
	assert.match(
		html,
		/id="exercise-template-1-trigger"[\s\S]*aria-controls="exercise-template-1-panel"[\s\S]*aria-expanded="false"/,
	);
	assert.match(
		html,
		/id="exercise-template-1-panel"[\s\S]*role="region"[\s\S]*aria-labelledby="exercise-template-1-trigger"/,
	);
	assert.equal((html.match(/id="exercise-template-1-panel"/g) ?? []).length, 1);
	assert.equal((html.match(/data-exercise-variant-id=/g) ?? []).length, 2);
	assert.equal((html.match(/data-exercise-id="1"/g) ?? []).length, 1);
	assert.equal((html.match(/data-update-exercise-template=/g) ?? []).length, 2);
	assert.match(html, /Optional\. Choose equipment when this variant requires it\./);
	assert.match(html, /<option\s+value=""[^>]*>\s*No equipment\s*<\/option>/);
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

test("Library renders contextual feedback and preserves variant mutation input", async () => {
	const viewModel = createLibraryPageViewModel({
		page,
		pageState: { userId: 7, sessionId: null },
		data: /** @type {any} */ ({
			...data,
			user: { id: 7, name: "Member", role: "user" },
			equipments: [{ id: 2, name: "Barbell" }],
			exerciseTemplates: [
				{
					id: 3,
					name: "Squat",
					movementPattern: {},
					equipment: { id: 1, name: "Dumbbell" },
					muscles: [],
					variant: { id: 12, name: "Old name", ownerUserId: 7 },
				},
			],
		}),
		variantFormState: {
			values: { exerciseId: "3", name: "Submitted variant", equipmentId: "2" },
			errors: { fieldErrors: { name: "Use another name." }, formErrors: [] },
		},
		privateVariantMutationState: {
			variantId: "12",
			values: { name: "Updated private variant", equipmentId: "2" },
			error: "Use another name.",
		},
		pageFeedback: {
			title: "Variant not saved",
			message: "Review the variant details and try again.",
		},
	});
	const html = await ejs.renderFile(path.resolve("views/library.ejs"), {
		...viewModel,
		csrfToken: "test-token",
		contentFor: () => "",
	});

	assert.match(html, /role="alert"/);
	assert.match(html, /Variant not saved/);
	assert.match(html, /Review the variant details and try again\./);
	assert.match(html, /value="Submitted variant"/);
	assert.match(html, /value="Updated private variant"/);
	assert.match(html, /Use another name\./);
});
