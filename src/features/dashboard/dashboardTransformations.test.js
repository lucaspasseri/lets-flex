import test from "node:test";
import assert from "node:assert/strict";
import getHeatmapArr from "./getHeatmapArr.js";
import getBarChartData from "./getBarChartData.js";
import resolveDashboardSelection from "./resolveDashboardSelection.js";

const cycles = [{ id: 1, programId: 2, name: "Base", size: 8, order: 1 }];
/** @param {number} id */
const session = (id) => ({
	id,
	trainingDayId: 10,
	sessionId: 20,
	order: id,
	status: "finished",
	startedAt: null,
	finishedAt: new Date(2026, 7, 20),
	scheduledDate: new Date(2026, 7, 20),
	notes: null,
	name: `Session ${id}`,
	sessionNotes: null,
	isArchived: false,
	steps: [],
});

test("dashboard metrics consume mapped domain objects and handle missing dates", () => {
	assert.deepEqual(getHeatmapArr(null, cycles, []), []);
	assert.deepEqual(getBarChartData([]), []);

	const heatmap = getHeatmapArr(new Date(2026, 7, 20), cycles, [
		{ dateKey: "2026-08-20", finishedCount: 1 },
	]);
	assert.equal(heatmap[0].days[0].intensity, "one");
	assert.equal(heatmap[0].days[0].dateLabel, "20/08");

	const chart = getBarChartData([
		{
			weekIndex: 0,
			weekStartDate: "2026-08-20",
			weekEndDate: "2026-08-26",
			scheduledCount: 2,
			finishedCount: 1,
			cancelledCount: 1,
			plannedCount: 0,
			inProgressCount: 0,
			completionRate: 0.5,
		},
	]);
	assert.equal(chart.length, 1);
	assert.equal(chart[0].label, "20/08");
	assert.equal(chart[0].scheduledCount, 2);
	assert.equal(chart[0].finishedCount, 1);
	assert.equal(chart[0].cancelledCount, 1);
});

test("dashboard selection falls back predictably to the first session", () => {
	const sessions = [session(1), session(2)];
	const trainingDay = {
		id: 10,
		cycleId: 1,
		programId: 2,
		cycleOrder: 1,
		dayOrder: 1,
		scheduledDate: new Date(),
		label: null,
	};
	const selected = resolveDashboardSelection({
		workoutSessionId: 999,
		trainingDay,
		cycles,
		workoutSessions: sessions,
	});

	assert.equal(selected.currentCycle?.id, 1);
	assert.equal(selected.selectedWorkoutSession?.id, 1);
	assert.equal(selected.currentDayWorkoutSessions.length, 2);
});
