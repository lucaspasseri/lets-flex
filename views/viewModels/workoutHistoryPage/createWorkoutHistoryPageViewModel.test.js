import assert from "node:assert/strict";
import test from "node:test";
import {
	createWorkoutHistoryDetailPageViewModel,
	createWorkoutHistoryListPageViewModel,
} from "./createWorkoutHistoryPageViewModel.js";
import { i18n } from "../../../src/infrastructure/i18n/i18n.js";

const currentUser = /** @type {any} */ ({ id: 1, name: "Member", role: "user" });

test("history list view model preserves filters across details and pagination", () => {
	const viewModel = createWorkoutHistoryListPageViewModel({
		page: { path: "/history" },
		filters: { programId: 4, fromDate: "2026-08-01", toDate: "2026-08-31" },
		data: {
			currentUser,
			programs: [/** @type {any} */ ({ id: 4, name: "Strength" })],
			history: {
				items: [
					{
						id: 9,
						status: "finished",
						historyDate: "2026-08-14",
						scheduledDate: "2026-08-12",
						startedAt: null,
						finishedAt: null,
						programId: 4,
						programName: "Strength",
						sessionName: "Lower body",
						stepCount: 3,
						performedStepCount: 2,
						skippedStepCount: 1,
					},
				],
				totalCount: 23,
				page: 2,
				pageSize: 20,
				totalPages: 2,
			},
		},
	});

	assert.equal(viewModel.shell.activeNavigation, "history");
	assert.equal(viewModel.results.items[0].viewTransitionName, "history-session-9");
	assert.equal(
		viewModel.results.items[0].href,
		"/history/9?programId=4&fromDate=2026-08-01&toDate=2026-08-31&page=2",
	);
	assert.equal(
		viewModel.pagination.previousHref,
		"/history?programId=4&fromDate=2026-08-01&toDate=2026-08-31",
	);
	assert.equal(viewModel.pagination.nextHref, null);
	assert.equal(viewModel.results.items[0].historyDate.context, "Completed");
	assert.equal(
		viewModel.results.items[0].stepSummary,
		"2 completed · 1 skipped · 3 total",
	);
});

test("history list view model distinguishes first-use, filtered, and out-of-range empty states", () => {
	const data = {
		currentUser,
		programs: [],
		history: {
			items: [],
			totalCount: 0,
			page: 1,
			pageSize: 20,
			totalPages: 0,
		},
	};
	assert.equal(
		createWorkoutHistoryListPageViewModel({
			page: {},
			data,
			filters: { programId: null, fromDate: null, toDate: null },
		}).results.empty.title,
		"No workout history yet",
	);

	const filtered = createWorkoutHistoryListPageViewModel({
		page: {},
		data: {
			...data,
			history: { ...data.history, totalCount: 21, totalPages: 2, page: 9 },
		},
		filters: { programId: null, fromDate: "2026-08-01", toDate: null },
	});
	assert.equal(filtered.results.empty.title, "No sessions match these filters");
	assert.equal(filtered.pagination.firstHref, "/history?fromDate=2026-08-01");

	const unavailableProgram = createWorkoutHistoryListPageViewModel({
		page: {},
		data,
		filters: { programId: 999, fromDate: null, toDate: null },
	});
	assert.deepEqual(unavailableProgram.filters.programOptions, [
		{ value: 999, label: "Unavailable program" },
	]);
});

test("history detail view model uses snapshot labels and retains the list return URL", () => {
	const viewModel = createWorkoutHistoryDetailPageViewModel({
		page: { path: "/history/9" },
		currentUser,
		returnFilters: { programId: 4, fromDate: null, toDate: null },
		returnPage: 3,
		history: {
			id: 9,
			status: "finished",
			historyDate: "2026-08-14",
			scheduledDate: "2026-08-12",
			startedAt: "2026-08-14T10:00:00.000Z",
			finishedAt: "2026-08-14T11:00:00.000Z",
			programId: 4,
			programName: "Strength",
			sessionName: "Push snapshot",
			notes: "Session note",
			steps: [
				{
					id: 2,
					order: 1,
					status: "performed",
					name: "Main movement",
					stepTypeName: "exercise",
					exerciseName: "Bench press",
					exerciseVariantName: "Barbell bench press",
					plannedSets: 3,
					plannedReps: 8,
					plannedLoadValue: 50,
					plannedLoadUnit: "Kilograms",
					startedAt: null,
					completedAt: "2026-08-14T10:30:00.000Z",
					notes: "Step note",
					sets: [{ id: 3, order: 1, reps: 8, loadValue: 50, loadUnit: "Kilograms" }],
				},
			],
		},
	});

	assert.equal(
		viewModel.backHref,
		"/history?programId=4&page=3#history-results-heading",
	);
	assert.equal(viewModel.viewTransitionName, "history-session-9");
	assert.equal(viewModel.steps[0].title, "Barbell bench press");
	assert.equal(viewModel.steps[0].exerciseName, "Bench press");
	assert.equal(viewModel.summary.historyDate.context, "Completed");
	assert.equal(viewModel.summary.scheduledDate?.value, "2026-08-12");
});

test("history localizes step types while preserving user-authored step names", () => {
	const viewModel = createWorkoutHistoryDetailPageViewModel({
		page: { path: "/history/9" },
		currentUser,
		returnFilters: { programId: null, fromDate: null, toDate: null },
		returnPage: 1,
		translate: i18n.getFixedT("pt-BR"),
		language: "pt-BR",
		history: /** @type {any} */ ({
			id: 9,
			status: "finished",
			historyDate: "2026-08-14",
			scheduledDate: null,
			startedAt: null,
			finishedAt: null,
			programId: 4,
			programName: "Força",
			sessionName: "Finalizador",
			notes: null,
			steps: [
				{
					id: 2,
					order: 1,
					status: "performed",
					name: "Box squats",
					stepTypeName: "exercise",
					exerciseName: "Box Squat",
					exerciseNameTranslation: "Agachamento na caixa",
					exerciseVariantName: "Bodyweight Box Squat",
					exerciseVariantNameTranslation: "Agachamento na caixa com peso corporal",
					plannedSets: 3,
					plannedReps: 8,
					plannedLoadValue: null,
					plannedLoadUnit: null,
					startedAt: null,
					completedAt: null,
					notes: null,
					sets: [],
				},
			],
		}),
	});

	assert.equal(viewModel.steps[0].stepTypeName, "Exercício");
	assert.equal(viewModel.steps[0].name, "Box squats");
	assert.equal(
		viewModel.steps[0].title,
		"Bodyweight Box Squat (Agachamento na caixa com peso corporal)",
	);
	assert.equal(viewModel.steps[0].exerciseName, "Box Squat (Agachamento na caixa)");
});

test("history detail keeps catalog names canonical when translations are unavailable or English is active", () => {
	const history = /** @type {any} */ ({
		id: 10,
		status: "finished",
		historyDate: "2026-08-14",
		scheduledDate: null,
		startedAt: null,
		finishedAt: null,
		programId: 4,
		programName: "Strength",
		sessionName: "Session",
		notes: null,
		steps: [
			{
				id: 3,
				order: 1,
				status: "performed",
				name: "Custom label",
				stepTypeName: "exercise",
				exerciseName: "Box Squat",
				exerciseVariantName: null,
				exerciseNameTranslation: null,
				exerciseVariantNameTranslation: null,
				plannedSets: null,
				plannedReps: null,
				plannedLoadValue: null,
				plannedLoadUnit: null,
				startedAt: null,
				completedAt: null,
				notes: null,
				sets: [],
			},
		],
	});

	const portuguese = createWorkoutHistoryDetailPageViewModel({
		page: {},
		currentUser,
		returnFilters: { programId: null, fromDate: null, toDate: null },
		returnPage: 1,
		translate: i18n.getFixedT("pt-BR"),
		language: "pt-BR",
		history,
	});
	const english = createWorkoutHistoryDetailPageViewModel({
		page: {},
		currentUser,
		returnFilters: { programId: null, fromDate: null, toDate: null },
		returnPage: 1,
		language: "en",
		history: {
			...history,
			steps: [
				{
					...history.steps[0],
					exerciseNameTranslation: "Agachamento na caixa",
				},
			],
		},
	});

	assert.equal(portuguese.steps[0].title, "Box Squat");
	assert.equal(portuguese.steps[0].name, "Custom label");
	assert.equal(english.steps[0].title, "Box Squat");
});
