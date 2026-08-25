import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import ejs from "ejs";
import createProgramsPageViewModel from "./createProgramsPageViewModel.js";

const page = {
	path: "/programs",
	url: "/programs?programId=10&cycleId=20",
	backUrl: "/",
	backUrlWithoutParams: "/",
	title: "Programs",
};

const currentUser = {
	id: 1,
	name: "Lucas",
	dateOfBirth: null,
	anamnesis: null,
};

const program = {
	id: 10,
	userId: 1,
	goalId: 2,
	name: "Strength",
	startDate: "2026-08-18",
};

const cycle = {
	id: 20,
	programId: 10,
	name: "Foundation",
	size: 2,
	order: 1,
};

const workoutSession = {
	id: 40,
	trainingDayId: 30,
	sessionId: 50,
	order: 1,
	status: "finished",
	startedAt: null,
	finishedAt: null,
	notes: null,
	name: "Push",
	sessionNotes: null,
	isArchived: false,
	steps: [],
};

test("Programs page creates presentation-ready component contracts", () => {
	const result = createProgramsPageViewModel({
		page,
		pageState: { userId: 1, programId: 10, cycleId: 20 },
		data: {
			currentUser,
			programs: { current: program, items: [program] },
			cycles: { current: cycle, items: [cycle] },
			trainingDays: [
				{
					id: 30,
					cycleId: 20,
					programId: 10,
					cycleOrder: 1,
					dayOrder: 1,
					scheduledDate: "2026-08-18",
					label: "Day 1",
				},
			],
			workoutSessions: [workoutSession],
			goals: [{ id: 2, name: "Build strength" }],
		},
	});

	assert.deepEqual(Object.keys(result), ["page", "pageState", "shell", "components"]);
	assert.equal(result.components.programSwitcher.items[0].isCurrent, true);
	assert.deepEqual(result.components.programSwitcher.items[0].deleteAction.values, {
		id: 10,
		name: "Strength",
		entity: "program",
	});
	assert.equal(
		result.components.cycleSwitcher.items[0].href,
		"/programs?programId=10&cycleId=20",
	);
	assert.equal(
		result.components.calendarNavigation.items[0].href,
		"/programs/day?dayId=30",
	);
	assert.equal(result.components.calendarNavigation.items[0].dateLabel, "18/08");
	assert.equal(
		result.components.calendarNavigation.items[0].statusMarkers.items[0].label,
		"Finished",
	);
	assert.deepEqual(result.components.createProgramForm.fields[1].options, [
		{ label: "Build strength", value: 2 },
	]);
	assert.deepEqual(result.components.createCycleForm.fields[2].options, [
		{ label: "Position 1", value: 1 },
		{ label: "Position 2", value: 2 },
	]);
});

test("Programs page exposes safe empty component states", () => {
	const result = createProgramsPageViewModel({
		page,
		pageState: { userId: null, programId: null, cycleId: null },
		data: {
			currentUser: null,
			programs: { current: null, items: [] },
			cycles: { current: null, items: [] },
			trainingDays: [],
			workoutSessions: [],
			goals: [],
		},
	});

	assert.equal(result.components.noActiveUser.isVisible, true);
	assert.equal(result.components.cycleSwitcher.isVisible, false);
	assert.equal(result.components.calendarNavigation.isVisible, false);
	assert.equal(result.components.createCycleForm.actions.submit.disabled, true);
});

test("Programs page preserves invalid values and exposes field and form errors", async () => {
	const result = createProgramsPageViewModel({
		page,
		pageState: { userId: 1, programId: 10, cycleId: 20 },
		data: {
			currentUser,
			programs: { current: program, items: [program] },
			cycles: { current: cycle, items: [cycle] },
			trainingDays: [],
			workoutSessions: [],
			goals: [{ id: 2, name: "Build strength" }],
		},
		programFormState: {
			open: true,
			values: { name: "  attempted name  ", goalId: "2", startDate: "bad-date" },
			errors: {
				fieldErrors: { startDate: "Enter a valid start date." },
				formErrors: ["Review the program details."],
			},
		},
		cycleFormState: {
			open: true,
			values: { name: "Attempted cycle", cycleSize: "0", cycleOrder: "1" },
			errors: {
				fieldErrors: { cycleSize: "Number of days must be at least 1." },
				formErrors: [],
			},
		},
	});

	assert.equal(result.components.createProgramForm.modal.openOnLoad, true);
	assert.equal(
		result.components.createProgramForm.fields[0].value,
		"  attempted name  ",
	);
	assert.equal(result.components.createProgramForm.fields[1].value, "2");
	assert.equal(
		result.components.createProgramForm.fields[2].error,
		"Enter a valid start date.",
	);
	assert.deepEqual(result.components.createProgramForm.formErrors, [
		"Review the program details.",
	]);
	assert.equal(result.components.createCycleForm.modal.openOnLoad, true);
	assert.equal(result.components.createCycleForm.fields[1].value, "0");

	const html = await ejs.renderFile(path.resolve("views/programs.ejs"), {
		...result,
		contentFor: () => "",
	});
	assert.match(html, /data-modal-open-on-load/);
	assert.ok(html.includes('value="  attempted name  "'));
	assert.match(html, /aria-invalid="true"/);
	assert.match(html, /Review the program details\./);
});

test("Programs template renders populated and no-profile component states", async () => {
	const renderFile =
		/** @type {(filename: string, data: object) => Promise<string>} */ (ejs.renderFile);
	const populated = createProgramsPageViewModel({
		page,
		pageState: { userId: 1, programId: 10, cycleId: 20 },
		data: {
			currentUser,
			programs: { current: program, items: [program] },
			cycles: { current: cycle, items: [cycle] },
			trainingDays: [
				{
					id: 30,
					cycleId: 20,
					programId: 10,
					cycleOrder: 1,
					dayOrder: 1,
					scheduledDate: "2026-08-18",
					label: "Day 1",
				},
			],
			workoutSessions: [{ ...workoutSession, status: "cancelled" }],
			goals: [{ id: 2, name: "Build strength" }],
		},
	});
	const noProfile = createProgramsPageViewModel({
		page,
		pageState: { userId: null, programId: null, cycleId: null },
		data: {
			currentUser: null,
			programs: { current: null, items: [] },
			cycles: { current: null, items: [] },
			trainingDays: [],
			workoutSessions: [],
			goals: [],
		},
	});

	const [populatedHtml, noProfileHtml] = await Promise.all(
		[populated, noProfile].map((viewModel) =>
			renderFile(path.resolve("views/programs.ejs"), {
				...viewModel,
				contentFor: () => "",
			}),
		),
	);

	assert.match(populatedHtml, /data-programs-page/);
	assert.match(populatedHtml, /id="program-switcher"/);
	assert.match(populatedHtml, /id="cycle-switcher"/);
	assert.match(populatedHtml, /href="\/programs\/day\?dayId=30"/);
	assert.match(populatedHtml, /session-status-marker--cancelled/);
	assert.match(populatedHtml, /Workout session: Cancelled/);
	assert.match(populatedHtml, /id="create-program-form"/);
	assert.match(populatedHtml, /id="create-cycle-form"/);
	assert.match(populatedHtml, /id="delete-program-form"/);
	assert.match(populatedHtml, /Delete program Strength/);
	assert.match(
		populatedHtml,
		/class="shared-button shared-button--danger-ghost shared-button--icon-only entity-card__delete"/,
	);
	assert.match(populatedHtml, /aria-label="Delete program Strength"/);
	assert.match(populatedHtml, /title="Delete program Strength"/);
	assert.doesNotMatch(populatedHtml, /basic-line|basicModal/);
	assert.match(noProfileHtml, /id="programs-empty-state-title"/);
	assert.doesNotMatch(noProfileHtml, /id="create-program-form"/);
});
