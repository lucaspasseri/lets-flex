import assert from "node:assert/strict";
import test from "node:test";

import createDetailsStepViewModel from "./createDetailsStepViewModel.js";

function step({ loadValue, loadUnit }) {
	return /** @type {any} */ ({
		id: 1,
		order: 1,
		type: "Exercise",
		sets: 3,
		reps: 10,
		loadValue,
		loadUnit,
		movementPattern: "Squat",
		exercise: {
			name: "Squat",
			variantName: "Bodyweight box squat",
			setupDescription: "Brace first.",
			environment: "Home",
			notes: "Use a stable box.",
		},
		equipment: {},
		muscles: [],
	});
}

test("session-detail prescriptions describe sets, reps, and an available load", () => {
	const detailsStep = createDetailsStepViewModel(
		step({ loadValue: 40, loadUnit: "Kilograms" }),
	);

	assert.equal(detailsStep.prescription.label, "3 sets × 10 reps · 40 Kilograms");
	assert.equal(detailsStep.media.src, "/media/category-strength.svg");
	assert.equal(detailsStep.media.isFallback, true);
});

test("session-detail prescriptions explain absent load data", () => {
	const detailsStep = createDetailsStepViewModel(
		step({ loadValue: null, loadUnit: null }),
	);

	assert.equal(detailsStep.prescription.label, "3 sets × 10 reps · No external load");
	assert.doesNotMatch(detailsStep.prescription.label, /null|undefined/);
});

test("session-detail prescriptions explain an unassigned equipment load", () => {
	const detailsStep = createDetailsStepViewModel({
		...step({ loadValue: null, loadUnit: null }),
		equipment: { name: "Dumbbell" },
	});

	assert.match(detailsStep.prescription.label, /Choose a manageable dumbbell load/);
});
