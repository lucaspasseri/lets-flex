import test from "node:test";
import assert from "node:assert/strict";
import { toProgram } from "./mapper.js";
import { toCycle } from "../cycles/mapper.js";
import { toTrainingDay } from "../trainingDays/mapper.js";
import { toGoal } from "../goals/mapper.js";
import resolveProgramsPageSelection from "./resolveProgramsPageSelection.js";

test("Programs page mappers isolate database column names", () => {
	assert.deepEqual(
		toProgram({
			id: 1,
			user_id: 2,
			goal_id: 3,
			name: "Strength",
			start_date: "2026-08-18",
		}),
		{
			id: 1,
			userId: 2,
			goalId: 3,
			name: "Strength",
			startDate: "2026-08-18",
		},
	);

	assert.deepEqual(
		toCycle({
			id: 4,
			program_id: 1,
			name: "Foundation",
			cycle_size: 7,
			cycle_order: 1,
		}),
		{id: 4, programId: 1, name: "Foundation", size: 7, order: 1},
	);

	assert.deepEqual(
		toTrainingDay({
			id: 5,
			cycle_id: 4,
			program_id: 1,
			cycle_order: 1,
			day_order: 2,
			scheduled_date: "2026-08-19",
			label: "Upper body",
		}),
		{
			id: 5,
			cycleId: 4,
			programId: 1,
			cycleOrder: 1,
			dayOrder: 2,
			scheduledDate: "2026-08-19",
			label: "Upper body",
		},
	);

	assert.deepEqual(toGoal({ id: 3, name: "Build strength" }), {
		id: 3,
		name: "Build strength",
	});
});

test("Programs page selection rejects a cycle from another program", () => {
	const programs = [
		{id: 1, userId: 1, goalId: null, name: "A", startDate: "2026-08-18"},
		{id: 2, userId: 1, goalId: null, name: "B", startDate: "2026-09-01"},
	];
	const allUserCycles = [
		{id: 10, programId: 1, name: "A1", size: 7, order: 1},
		{id: 20, programId: 2, name: "B1", size: 7, order: 1},
	];

	const selection = resolveProgramsPageSelection({
		programId: 1,
		cycleId: 20,
		programs,
		allUserCycles,
	});

	assert.equal(selection.currentProgram?.id, 1);
	assert.equal(selection.currentCycle, null);
	assert.deepEqual(selection.programCycles.map(cycle => cycle.id), [10]);
});
