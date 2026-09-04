import assert from "node:assert/strict";
import test from "node:test";
import getProgramAnalytics from "./getProgramAnalytics.js";
import { emptyProgramAnalytics } from "./mapper.js";

test("program analytics maps stable typed buckets through the ownership-scoped repository", async () => {
	const calls = [];
	const db = /** @type {any} */ ({
		async query(sql, parameters) {
			calls.push({ sql, parameters });
			return {
				rows: [
					{
						activity: [
							{ dateKey: "2026-08-12", finishedCount: "2" },
							{ dateKey: "2026-08-03", finishedCount: 1 },
						],
						adherence: [
							{
								weekIndex: 1,
								weekStartDate: "2026-08-10",
								weekEndDate: "2026-08-16",
								scheduledCount: "1",
								finishedCount: "1",
								cancelledCount: 0,
								plannedCount: 0,
								inProgressCount: 0,
							},
							{
								weekIndex: 0,
								weekStartDate: "2026-08-03",
								weekEndDate: "2026-08-09",
								scheduledCount: 2,
								finishedCount: 1,
								cancelledCount: 1,
								plannedCount: 0,
								inProgressCount: 0,
							},
						],
						performed_work: {
							performedStepCount: "2",
							recordedSetCount: "5",
							completedRepetitionCount: "23",
							setsWithRepetitionsCount: "4",
						},
						load_volume: [
							{ unit: "Libra", volume: "180", setCount: 1 },
							{ unit: "Kilograms", volume: "100", setCount: "2" },
						],
					},
				],
			};
		},
	});

	const analytics = await getProgramAnalytics({ programId: 7, userId: 11 }, db);

	assert.deepEqual(calls[0].parameters, [7, 11]);
	assert.match(calls[0].sql, /p\.id = \$1 AND p\.user_id = \$2/);
	assert.deepEqual(analytics, {
		activity: [
			{ dateKey: "2026-08-03", finishedCount: 1 },
			{ dateKey: "2026-08-12", finishedCount: 2 },
		],
		adherence: [
			{
				weekIndex: 0,
				weekStartDate: "2026-08-03",
				weekEndDate: "2026-08-09",
				scheduledCount: 2,
				finishedCount: 1,
				cancelledCount: 1,
				plannedCount: 0,
				inProgressCount: 0,
				completionRate: 0.5,
			},
			{
				weekIndex: 1,
				weekStartDate: "2026-08-10",
				weekEndDate: "2026-08-16",
				scheduledCount: 1,
				finishedCount: 1,
				cancelledCount: 0,
				plannedCount: 0,
				inProgressCount: 0,
				completionRate: 1,
			},
		],
		performedWork: {
			performedStepCount: 2,
			recordedSetCount: 5,
			completedRepetitionCount: 23,
			setsWithRepetitionsCount: 4,
		},
		loadVolume: [
			{ unit: "Kilograms", volume: 100, setCount: 2 },
			{ unit: "Libra", volume: 180, setCount: 1 },
		],
	});
});

test("program analytics distinguishes an unowned program from an owned empty program", async () => {
	const noRows = /** @type {any} */ ({
		query: async () => ({ rows: [] }),
	});

	assert.equal(await getProgramAnalytics({ programId: 7, userId: 12 }, noRows), null);
	assert.deepEqual(emptyProgramAnalytics(), {
		activity: [],
		adherence: [],
		performedWork: {
			performedStepCount: 0,
			recordedSetCount: 0,
			completedRepetitionCount: 0,
			setsWithRepetitionsCount: 0,
		},
		loadVolume: [],
	});
});
