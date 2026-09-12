import assert from "node:assert/strict";
import test from "node:test";
import { toExerciseProgressKey } from "../../../src/features/exerciseProgress/mapper.js";
import {
	createExerciseProgressPageViewModel,
	createExerciseProgressStatePageViewModel,
} from "./createExerciseProgressPageViewModel.js";

const user = /** @type {import("../../../src/features/users/users.types.js").User} */ ({
	id: 1,
	name: "Owner",
	email: "owner@example.com",
	role: "user",
	dateOfBirth: null,
	anamnesis: null,
});
const program = {
	id: 4,
	userId: 1,
	goalId: null,
	name: "Strength",
	startDate: "2026-01-01",
};
const choice = {
	key: toExerciseProgressKey("Squat", "Back squat"),
	exerciseName: "Squat",
	exerciseVariantName: "Back squat",
	occurrenceCount: 3,
	firstDate: "2026-07-01",
	lastDate: "2026-09-01",
};
const query = {
	programId: 4,
	exerciseKey: choice.key,
	fromDate: "2026-08-01",
	toDate: "2026-09-01",
	pointLimit: 25,
};
const progress = {
	programId: 4,
	selection: choice,
	filters: { fromDate: query.fromDate, toDate: query.toDate },
	summary: {
		occurrenceCount: 2,
		performedStepCount: 3,
		recordedSetCount: 5,
		setsWithRepetitionsCount: 4,
		completedRepetitionCount: 24,
		setsWithLoadCount: 3,
		setsWithVolumeCount: 2,
		units: [
			{
				unit: "Kilograms",
				loadObservationCount: 3,
				maximumLoad: 102.5,
				volumeSetCount: 2,
				volume: 1640,
			},
		],
	},
	occurrences: [
		{
			workoutSessionId: 11,
			dateKey: "2026-09-01",
			finishedAt: "2026-09-01T10:00:00.000Z",
			sessionName: "Lower body",
			performedStepCount: 2,
			recordedSetCount: 5,
			setsWithRepetitionsCount: 4,
			completedRepetitionCount: 24,
			setsWithLoadCount: 3,
			setsWithVolumeCount: 2,
			units: [
				{
					unit: "Kilograms",
					loadObservationCount: 3,
					maximumLoad: 102.5,
					volumeSetCount: 2,
					volume: 1640,
				},
			],
		},
	],
	series: [],
	totalOccurrenceCount: 2,
	returnedOccurrenceCount: 1,
	isTruncated: true,
	pointLimit: 25,
};

test("progress page view model exposes stable filters, coverage, units, and history links", () => {
	const view = createExerciseProgressPageViewModel({
		page: { title: "Old" },
		data: { currentUser: user, programs: [program], choices: [choice], progress },
		query,
	});

	assert.equal(view.page.title, "Exercise progress · Let's Flex!");
	assert.equal(view.shell.activeNavigation, "progress");
	assert.deepEqual(view.programFilter.options, [{ value: 4, label: "Strength" }]);
	assert.equal(view.analysisFilter.exerciseKey, choice.key);
	assert.equal(
		view.analysisFilter.clearDatesHref,
		`/progress?programId=4&exerciseKey=${encodeURIComponent(choice.key)}&pointLimit=25`,
	);
	assert.equal(view.results.selection.title, "Squat — Back squat");
	assert.deepEqual(view.results.metrics, [
		{ label: "Workout occurrences", value: "2" },
		{ label: "Performed steps", value: "3" },
		{ label: "Recorded sets", value: "5" },
		{ label: "Completed repetitions", value: "24" },
	]);
	assert.deepEqual(view.results.coverage, [
		"4 of 5 recorded sets have valid repetitions.",
		"3 of 5 recorded sets have a valid load and unit.",
		"2 of 5 recorded sets contribute to load volume.",
	]);
	assert.deepEqual(view.results.units[0], {
		unit: "Kilograms",
		maximumLoad: "102.5 kg",
		volume: "1,640 repetitions × kg",
		loadContext: "3 load observations",
		volumeContext: "2 volume sets",
	});
	assert.equal(view.results.occurrences[0].historyHref, "/history/11");
	assert.equal(view.results.occurrences[0].date.label, "Sep 1, 2026");
	assert.equal(
		view.results.truncationMessage,
		"Showing the most recent 1 of 2 workouts in this range.",
	);
	assert.equal(view.state, null);
});

test("progress presentation formats dates, decimal loads, and units for Brazilian Portuguese", () => {
	const view = createExerciseProgressPageViewModel({
		page: {},
		data: { currentUser: user, programs: [program], choices: [choice], progress },
		query,
		language: "pt-BR",
		translate: (key, options) =>
			key === "progress.repetitionsByUnit"
				? `${options.value} repetições × ${options.unit}`
				: options.defaultValue,
	});

	assert.equal(view.results.occurrences[0].date.label, "1 de set. de 2026");
	assert.equal(view.results.units[0].maximumLoad, "102,5 kg");
	assert.equal(view.results.units[0].volume, "1.640 repetições × kg");
});

test("progress page view model distinguishes each unavailable and empty selection state", () => {
	const scenarios = [
		{
			data: { currentUser: user, programs: [], choices: [], progress: null },
			query: { ...query, programId: null, exerciseKey: null },
			kind: "no-programs",
		},
		{
			data: { currentUser: user, programs: [program], choices: [], progress: null },
			query: { ...query, programId: null, exerciseKey: null },
			kind: "choose-program",
		},
		{
			data: { currentUser: user, programs: [program], choices: [], progress: null },
			query: { ...query, programId: 99, exerciseKey: null },
			kind: "unavailable-program",
		},
		{
			data: { currentUser: user, programs: [program], choices: [], progress: null },
			query: { ...query, exerciseKey: null },
			kind: "no-exercises",
		},
		{
			data: {
				currentUser: user,
				programs: [program],
				choices: [choice],
				progress: null,
			},
			query: { ...query, exerciseKey: null },
			kind: "choose-exercise",
		},
		{
			data: {
				currentUser: user,
				programs: [program],
				choices: [choice],
				progress: null,
			},
			query: {
				...query,
				exerciseKey: toExerciseProgressKey("Unavailable", null),
			},
			kind: "unavailable-exercise",
		},
		{
			data: {
				currentUser: user,
				programs: [program],
				choices: [choice],
				progress: {
					...progress,
					summary: { ...progress.summary, occurrenceCount: 0 },
					occurrences: [],
					totalOccurrenceCount: 0,
					returnedOccurrenceCount: 0,
					isTruncated: false,
				},
			},
			query,
			kind: "no-results",
		},
	];

	for (const scenario of scenarios) {
		const view = createExerciseProgressPageViewModel({
			page: {},
			data: scenario.data,
			query: scenario.query,
		});
		assert.equal(view.state?.kind, scenario.kind);
		assert.equal(view.results.isVisible, false);
	}
});

test("progress state page exposes generic recovery without sensitive details", () => {
	const failure = createExerciseProgressStatePageViewModel({
		page: {},
		currentUser: user,
		state: "failure",
	});
	assert.equal(failure.shell.activeNavigation, "progress");
	assert.equal(failure.state.title, "Progress could not be loaded");
	assert.equal(failure.state.actionHref, "/progress");
	assert.match(failure.state.message, /workout data has not been changed/);
});
