import assert from "node:assert/strict";
import test from "node:test";

import { toTrainingDayContext } from "./mapper.js";

test("owned training-day context maps its program, cycle, and day hierarchy", () => {
	const context = toTrainingDayContext({
		id: 30,
		cycle_id: 20,
		day_order: 2,
		scheduled_date: "2026-09-02",
		label: "Lower body",
		cycle_name: "Foundation",
		cycle_size: 4,
		cycle_order: 1,
		program_id: 10,
		user_id: 7,
		goal_id: 3,
		program_name: "Strength plan",
		program_start_date: "2026-09-01",
	});

	assert.equal(context.program.name, "Strength plan");
	assert.equal(context.cycle.name, "Foundation");
	assert.deepEqual(context.day, {
		id: 30,
		cycleId: 20,
		programId: 10,
		cycleOrder: 1,
		dayOrder: 2,
		scheduledDate: "2026-09-02",
		label: "Lower body",
	});
});
