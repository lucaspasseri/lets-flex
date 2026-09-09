import assert from "node:assert/strict";
import test from "node:test";
import {
	createWorkoutHistoryDetailPageViewModel,
	createWorkoutHistoryListPageViewModel,
} from "./createWorkoutHistoryPageViewModel.js";

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

	assert.equal(viewModel.backHref, "/history?programId=4&page=3");
	assert.equal(viewModel.steps[0].title, "Barbell bench press");
	assert.equal(viewModel.steps[0].exerciseName, "Bench press");
	assert.equal(viewModel.summary.historyDate.context, "Completed");
	assert.equal(viewModel.summary.scheduledDate?.value, "2026-08-12");
});
