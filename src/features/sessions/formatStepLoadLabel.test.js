import assert from "node:assert/strict";
import test from "node:test";
import formatStepLoadLabel from "./formatStepLoadLabel.js";

test("formats a prescribed load", () => {
	assert.equal(
		formatStepLoadLabel({ loadValue: 20, loadUnit: "Kilograms" }),
		"20 Kilograms",
	);
});

test("explains a load-capable step without an arbitrary prescription", () => {
	assert.equal(
		formatStepLoadLabel({ equipmentName: "Dumbbell" }),
		"Choose a manageable dumbbell load",
	);
});

test("labels a step with no external load", () => {
	assert.equal(formatStepLoadLabel({}), "No external load");
});
