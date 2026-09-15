import assert from "node:assert/strict";
import test from "node:test";

import createViewTransitionName from "./createViewTransitionName.js";
import createDayViewTransitionName from "./createDayViewTransitionName.js";

test("View Transition names preserve stable safe identifiers", () => {
	assert.equal(createViewTransitionName("history-session", 42), "history-session-42");
	assert.equal(
		createViewTransitionName("exercise", "row 7/8"),
		"exercise-x7-0072006f007700200037002f0038",
	);
	assert.notEqual(
		createViewTransitionName("exercise", "row 7/8"),
		createViewTransitionName("exercise", "row-20-7-2f-8"),
	);
});

test("View Transition names fail closed for missing or unsafe prefixes", () => {
	assert.equal(createViewTransitionName("history-session", null), null);
	assert.equal(createViewTransitionName("history-session", ""), null);
	assert.equal(createViewTransitionName("history-session", "   "), null);
	assert.equal(createViewTransitionName("", "42"), null);
	assert.equal(createViewTransitionName("123-history", "42"), null);
});

test("day transition names retain the existing numeric contract", () => {
	assert.equal(createDayViewTransitionName(7), "program-calendar-day-7");
	assert.equal(createDayViewTransitionName(null), null);
});
