import assert from "node:assert/strict";
import test from "node:test";
import getWorkoutHistoryDetail from "./getWorkoutHistoryDetail.js";
import getWorkoutHistoryPage, {
	DEFAULT_HISTORY_PAGE_SIZE,
	MAX_HISTORY_PAGE,
	MAX_HISTORY_PAGE_SIZE,
} from "./getWorkoutHistoryPage.js";

test("history page applies owned terminal filters, stable pagination, and typed mapping", async () => {
	const calls = [];
	const db = /** @type {any} */ ({
		async query(sql, parameters) {
			calls.push({ sql, parameters });
			return {
				rows: [
					{
						total_count: "3",
						items: [
							{
								id: 18,
								status: "finished",
								history_date: "2026-09-02",
								scheduled_date: "2026-08-30",
								started_at: "2026-09-02T12:00:00.000Z",
								finished_at: "2026-09-02T13:00:00.000Z",
								program_id: 4,
								program_name: "Strength",
								session_name: "Lower body",
								step_count: "2",
								performed_step_count: "1",
								skipped_step_count: "1",
							},
						],
					},
				],
			};
		},
	});

	const page = await getWorkoutHistoryPage(
		{
			userId: 7,
			filters: {
				programId: 4,
				fromDate: "2026-09-01",
				toDate: "2026-09-30",
			},
			page: 2,
			pageSize: 2,
		},
		db,
	);

	assert.deepEqual(calls[0].parameters, [7, 4, "2026-09-01", "2026-09-30", 2, 2]);
	assert.match(calls[0].sql, /p\.user_id = \$1/);
	assert.match(calls[0].sql, /ws\.status IN \('finished', 'cancelled'\)/);
	assert.match(calls[0].sql, /history\.id DESC/);
	assert.deepEqual(page, {
		items: [
			{
				id: 18,
				status: "finished",
				historyDate: "2026-09-02",
				scheduledDate: "2026-08-30",
				startedAt: "2026-09-02T12:00:00.000Z",
				finishedAt: "2026-09-02T13:00:00.000Z",
				programId: 4,
				programName: "Strength",
				sessionName: "Lower body",
				stepCount: 2,
				performedStepCount: 1,
				skippedStepCount: 1,
			},
		],
		totalCount: 3,
		page: 2,
		pageSize: 2,
		totalPages: 2,
	});
});

test("history page bounds unsafe pagination inputs and represents an empty page", async () => {
	const calls = [];
	const db = /** @type {any} */ ({
		async query(_sql, parameters) {
			calls.push(parameters);
			return { rows: [{ total_count: 0, items: [] }] };
		},
	});
	const filters = { programId: null, fromDate: null, toDate: null };

	assert.deepEqual(
		await getWorkoutHistoryPage(
			{ userId: 3, filters, page: 0, pageSize: MAX_HISTORY_PAGE_SIZE + 10 },
			db,
		),
		{
			items: [],
			totalCount: 0,
			page: 1,
			pageSize: MAX_HISTORY_PAGE_SIZE,
			totalPages: 0,
		},
	);
	assert.deepEqual(calls[0], [3, null, null, null, MAX_HISTORY_PAGE_SIZE, 0]);

	await getWorkoutHistoryPage(
		{ userId: 3, filters, page: Number.NaN, pageSize: 0 },
		db,
	);
	assert.deepEqual(calls[1], [3, null, null, null, DEFAULT_HISTORY_PAGE_SIZE, 0]);

	await getWorkoutHistoryPage(
		{ userId: 3, filters, page: MAX_HISTORY_PAGE + 1, pageSize: 1 },
		db,
	);
	assert.deepEqual(calls[2], [3, null, null, null, 1, MAX_HISTORY_PAGE - 1]);
});

test("history detail maps immutable snapshots, ordered sets, notes, and units", async () => {
	const calls = [];
	const db = /** @type {any} */ ({
		async query(sql, parameters) {
			calls.push({ sql, parameters });
			return {
				rows: [
					{
						id: 41,
						status: "finished",
						history_date: "2026-09-03",
						scheduled_date: "2026-09-01",
						started_at: "2026-09-03T10:00:00.000Z",
						finished_at: "2026-09-03T11:00:00.000Z",
						program_id: 8,
						program_name: "Hypertrophy",
						session_name: "Push day snapshot",
						notes: "Felt strong",
						steps: [
							{
								id: 5,
								order: 1,
								status: "performed",
								name: "Main press",
								stepTypeName: "exercise",
								exerciseName: "Bench press",
								exerciseVariantName: "Barbell bench press",
								plannedSets: 3,
								plannedReps: 8,
								plannedLoadValue: 50,
								plannedLoadUnit: "Kilograms",
								startedAt: null,
								completedAt: "2026-09-03T10:40:00.000Z",
								notes: "Controlled tempo",
								sets: [
									{
										id: 9,
										order: 1,
										reps: 8,
										loadValue: 50,
										loadUnit: "Kilograms",
									},
								],
							},
						],
					},
				],
			};
		},
	});

	const detail = await getWorkoutHistoryDetail(
		{ workoutSessionId: 41, userId: 12 },
		db,
	);
	assert.deepEqual(calls[0].parameters, [41, 12]);
	assert.match(calls[0].sql, /p\.user_id = \$2/);
	assert.doesNotMatch(calls[0].sql, /JOIN sessions|JOIN session_steps/);
	assert.deepEqual(detail?.steps[0], {
		id: 5,
		order: 1,
		status: "performed",
		name: "Main press",
		stepTypeName: "exercise",
		exerciseName: "Bench press",
		exerciseVariantName: "Barbell bench press",
		plannedSets: 3,
		plannedReps: 8,
		plannedLoadValue: 50,
		plannedLoadUnit: "Kilograms",
		startedAt: null,
		completedAt: "2026-09-03T10:40:00.000Z",
		notes: "Controlled tempo",
		sets: [{ id: 9, order: 1, reps: 8, loadValue: 50, loadUnit: "Kilograms" }],
	});
});

test("history detail hides missing, active, and cross-account sessions identically", async () => {
	const db = /** @type {any} */ ({ query: async () => ({ rows: [] }) });
	assert.equal(
		await getWorkoutHistoryDetail({ workoutSessionId: 99, userId: 12 }, db),
		null,
	);
});
