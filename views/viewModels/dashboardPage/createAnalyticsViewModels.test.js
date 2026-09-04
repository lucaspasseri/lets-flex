import test from "node:test";
import assert from "node:assert/strict";
import createAnalyticsSummaryViewModel from "./createAnalyticsSummaryViewModel.js";
import createBarChartViewModel from "./createBarChartViewModel.js";
import createHeatmapViewModel from "./createHeatmapViewModel.js";
import createWorkloadViewModel from "./createWorkloadViewModel.js";

const currentProgram = {
	id: 7,
	userId: 3,
	goalId: null,
	name: "Strength block",
	startDate: new Date(2026, 7, 3),
};
const analytics = {
	activity: [
		{ dateKey: "2026-08-04", finishedCount: 1 },
		{ dateKey: "2026-08-12", finishedCount: 2 },
	],
	adherence: [
		{
			weekIndex: 0,
			weekStartDate: "2026-08-03",
			weekEndDate: "2026-08-09",
			scheduledCount: 3,
			finishedCount: 2,
			cancelledCount: 1,
			plannedCount: 0,
			inProgressCount: 0,
			completionRate: 2 / 3,
		},
		{
			weekIndex: 1,
			weekStartDate: "2026-08-10",
			weekEndDate: "2026-08-16",
			scheduledCount: 2,
			finishedCount: 1,
			cancelledCount: 0,
			plannedCount: 1,
			inProgressCount: 0,
			completionRate: 0.5,
		},
	],
	performedWork: {
		performedStepCount: 5,
		recordedSetCount: 8,
		completedRepetitionCount: 54,
		setsWithRepetitionsCount: 7,
	},
	loadVolume: [
		{ unit: "Kilograms", volume: 480, setCount: 5 },
		{ unit: "Libra", volume: 160, setCount: 2 },
	],
};

test("analytics view models prioritize progress while preserving exact non-color data", () => {
	const summary = createAnalyticsSummaryViewModel(
		/** @type {any} */ ({ currentProgram, analytics }),
	);
	const adherence = createBarChartViewModel({ currentProgram, analytics });
	const workload = createWorkloadViewModel(
		/** @type {any} */ ({ currentProgram, analytics }),
	);
	const activity = createHeatmapViewModel({
		currentProgram,
		heatmap: [
			{
				cycleId: 9,
				cycleName: "Foundation",
				days: [
					{
						date: new Date(2026, 7, 4),
						dateKey: "2026-08-04",
						dateLabel: "04/08",
						offset: 2,
						intensity: "one",
						finishedCount: 1,
					},
					{
						date: new Date(2026, 7, 12),
						dateKey: "2026-08-12",
						dateLabel: "12/08",
						offset: null,
						intensity: "many",
						finishedCount: 2,
					},
				],
			},
		],
	});

	assert.equal(summary.primaryMetric.value, "60%");
	assert.match(summary.primaryMetric.context, /3 of 5 scheduled sessions finished/);
	assert.equal(summary.metrics[0].value, "3");
	assert.deepEqual(adherence.labels, ["W1", "W2"]);
	assert.deepEqual(adherence.cancelledCounts, [1, 0]);
	assert.equal(adherence.rows[1].remainingCount, 1);
	assert.equal(adherence.showChart, true);
	assert.equal(activity.cycles[0].days[1].marker, "2");
	assert.match(activity.cycles[0].days[1].accessibleLabel, /2 finished workouts/);
	assert.equal(activity.activityRows.length, 2);
	assert.equal(workload.repetitionCoverage, "7 of 8 sets include repetitions.");
	assert.deepEqual(
		workload.volume.items.map((item) => item.accessibleValue),
		["480 kilograms", "160 pounds"],
	);
});

test("analytics view models expose intentional empty states without inventing zero adherence", () => {
	const emptyAnalytics = {
		activity: [],
		adherence: [],
		performedWork: {
			performedStepCount: 0,
			recordedSetCount: 0,
			completedRepetitionCount: 0,
			setsWithRepetitionsCount: 0,
		},
		loadVolume: [],
	};
	const input = /** @type {any} */ ({ currentProgram, analytics: emptyAnalytics });

	assert.equal(createAnalyticsSummaryViewModel(input).isEmpty, true);
	assert.equal(createAnalyticsSummaryViewModel(input).primaryMetric.value, "—");
	assert.equal(createBarChartViewModel(input).showChart, false);
	assert.equal(createBarChartViewModel(input).isEmpty, true);
	assert.equal(createWorkloadViewModel(input).isEmpty, true);
	assert.equal(createHeatmapViewModel({ currentProgram, heatmap: [] }).isEmpty, true);
});
