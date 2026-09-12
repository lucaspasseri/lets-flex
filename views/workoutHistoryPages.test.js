import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import ejs from "ejs";
import {
	createWorkoutHistoryDetailPageViewModel,
	createWorkoutHistoryListPageViewModel,
	createWorkoutHistoryStatePageViewModel,
} from "./viewModels/workoutHistoryPage/createWorkoutHistoryPageViewModel.js";

const renderFile = /** @type {(filename: string, data: object) => Promise<string>} */ (
	ejs.renderFile
);
const currentUser = /** @type {any} */ ({ id: 1, name: "Member", role: "user" });

test("history list renders semantic filters, status text, dates, and retained links", async () => {
	const viewModel = createWorkoutHistoryListPageViewModel({
		page: {},
		filters: { programId: 3, fromDate: "2026-08-01", toDate: null },
		data: {
			currentUser,
			programs: [/** @type {any} */ ({ id: 3, name: "Program <unsafe>" })],
			history: {
				items: [
					{
						id: 7,
						status: "cancelled",
						historyDate: "2026-08-10",
						scheduledDate: "2026-08-10",
						startedAt: null,
						finishedAt: null,
						programId: 3,
						programName: "Program <unsafe>",
						sessionName: "Session <unsafe>",
						stepCount: 0,
						performedStepCount: 0,
						skippedStepCount: 0,
					},
				],
				totalCount: 1,
				page: 1,
				pageSize: 20,
				totalPages: 1,
			},
		},
	});
	const html = await renderFile(path.resolve("views/history/index.ejs"), viewModel);

	assert.match(html, /<main[^>]+data-workout-history-page/);
	assert.match(html, /<form method="GET" action="\/history"[^>]*>/);
	assert.match(html, /<label[^>]+for="history-program"/);
	assert.match(html, /<input[^>]+name="fromDate"[^>]+type="date"/);
	assert.match(html, /Cancelled/);
	assert.match(html, /data-status="cancelled"/);
	assert.match(html, /aria-label="Exercise result summary"/);
	assert.match(html, /<time datetime="2026-08-10">/);
	assert.match(html, /href="\/history\/7\?programId=3&amp;fromDate=2026-08-01"/);
	assert.match(html, /Session &lt;unsafe&gt;/);
	assert.doesNotMatch(html, /Session <unsafe>/);
});

test("history detail renders snapshots, performed sets, notes, and units without mutation controls", async () => {
	const viewModel = createWorkoutHistoryDetailPageViewModel({
		page: {},
		currentUser,
		returnFilters: { programId: null, fromDate: null, toDate: null },
		returnPage: 1,
		history: {
			id: 7,
			status: "finished",
			historyDate: "2026-08-10",
			scheduledDate: "2026-08-08",
			startedAt: "2026-08-10T10:00:00.000Z",
			finishedAt: "2026-08-10T11:00:00.000Z",
			programId: 3,
			programName: "Program",
			sessionName: "Session snapshot",
			notes: "Session <script>alert(1)</script>",
			steps: [
				{
					id: 4,
					order: 1,
					status: "performed",
					name: "Main step",
					stepTypeName: "exercise",
					exerciseName: "Squat",
					exerciseVariantName: "Back squat",
					plannedSets: 2,
					plannedReps: 8,
					plannedLoadValue: 100,
					plannedLoadUnit: "Kilograms",
					startedAt: null,
					completedAt: "2026-08-10T10:30:00.000Z",
					notes: "Step <strong>note</strong>",
					sets: [{ id: 8, order: 1, reps: 8, loadValue: 100, loadUnit: "Kilograms" }],
				},
			],
		},
	});
	const html = await renderFile(path.resolve("views/history/detail.ejs"), viewModel);

	assert.match(html, /<main[^>]+data-workout-history-detail/);
	assert.match(html, /<dl>/);
	assert.match(html, /<table>/);
	assert.match(html, /role="region" aria-label="Performed sets for Back squat"/);
	assert.match(html, /<caption>Performed sets for Back squat<\/caption>/);
	assert.match(html, /100 kg/);
	assert.match(html, /Session &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
	assert.match(html, /Step &lt;strong&gt;note&lt;\/strong&gt;/);
	assert.doesNotMatch(html, /method="POST"|method="PATCH"|method="DELETE"/);
});

test("history not-found and failure states give generic recovery paths", async () => {
	for (const state of /** @type {const} */ (["not-found", "failure"])) {
		const html = await renderFile(
			path.resolve("views/history/status.ejs"),
			createWorkoutHistoryStatePageViewModel({ page: {}, currentUser, state }),
		);
		assert.match(html, new RegExp(`data-workout-history-state="${state}"`));
		assert.match(html, /href="\/history"/);
		assert.doesNotMatch(html, /account id|session id|query|stack/i);
	}
});

test("cancelled history detail renders an intentional sparse state", async () => {
	const viewModel = createWorkoutHistoryDetailPageViewModel({
		page: {},
		currentUser,
		returnFilters: { programId: null, fromDate: null, toDate: null },
		returnPage: 1,
		history: {
			id: 8,
			status: "cancelled",
			historyDate: null,
			scheduledDate: null,
			startedAt: null,
			finishedAt: null,
			programId: 3,
			programName: "Program",
			sessionName: "Cancelled session",
			notes: null,
			steps: [],
		},
	});
	const html = await renderFile(path.resolve("views/history/detail.ejs"), viewModel);

	assert.match(html, /No workout results/);
	assert.match(html, /cancelled before exercise results were recorded/);
	assert.match(html, /Date unavailable/);
});
