import test from "node:test";
import assert from "node:assert/strict";
import formatGoalLabel from "./formatGoalLabel.js";

test("formats persisted goal identifiers as title-cased display words", () => {
	assert.equal(formatGoalLabel("hypertrophy"), "Hypertrophy");
	assert.equal(formatGoalLabel("weight_loss"), "Weight Loss");
	assert.equal(formatGoalLabel("general_fitness"), "General Fitness");
	assert.equal(formatGoalLabel("  MUSCLE__GAIN  "), "Muscle Gain");
});

test("returns an empty label for empty and non-string input", () => {
	for (const value of ["", "___", null, undefined, 7, {}]) {
		assert.equal(formatGoalLabel(value), "");
	}
});
