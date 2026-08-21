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
			goals: [{ id: 2, name: "Build strength" }],
		},
	});

	assert.deepEqual(Object.keys(result), ["page", "pageState", "shell", "components"]);
	assert.equal(result.components.programSwitcher.items[0].isCurrent, true);
	assert.equal(result.components.cycleSwitcher.items[0].href, "/programs?programId=10&cycleId=20");
	assert.equal(result.components.calendarNavigation.items[0].href, "/programs/day?dayId=30");
	assert.equal(result.components.calendarNavigation.items[0].dateLabel, "18/08");
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
			goals: [],
		},
	});

	assert.equal(result.components.noActiveUser.isVisible, true);
	assert.equal(result.components.cycleSwitcher.isVisible, false);
	assert.equal(result.components.calendarNavigation.isVisible, false);
	assert.equal(result.components.createCycleForm.actions.submit.disabled, true);
});

test("Programs template renders populated and no-profile component states", async () => {
	const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
		ejs.renderFile
	);
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
			goals: [],
		},
	});

	const [populatedHtml, noProfileHtml] = await Promise.all(
		[populated, noProfile].map(viewModel =>
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
	assert.match(populatedHtml, /id="create-program-form"/);
	assert.match(populatedHtml, /id="create-cycle-form"/);
	assert.doesNotMatch(populatedHtml, /basic-line|basicModal/);
	assert.match(noProfileHtml, /id="programs-empty-state-title"/);
	assert.doesNotMatch(noProfileHtml, /id="create-program-form"/);
});
