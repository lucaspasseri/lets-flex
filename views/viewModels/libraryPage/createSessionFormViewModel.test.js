import assert from "node:assert/strict";
import test from "node:test";

import createSessionFormViewModel from "./createSessionFormViewModel.js";

const squat = {
	id: 1,
	name: "Squat",
	movementPattern: { id: 1, name: "Squat", notes: "" },
	equipment: { id: 1, name: "Barbell", category: "Free weight" },
	muscles: [],
};

test("session exercise choices distinguish variants while preserving their identities", () => {
	const form = createSessionFormViewModel({
		stepTypes: [],
		exerciseTemplates: [
			{
				...squat,
				variant: {
					id: 11,
					name: "Barbell Back Squat",
					setupDescription: "",
					environment: "Gym",
					notes: "",
					ownerUserId: null,
					isArchived: false,
				},
			},
			{
				...squat,
				variant: {
					id: 12,
					name: "Goblet Squat",
					setupDescription: "",
					environment: "Gym",
					notes: "",
					ownerUserId: null,
					isArchived: false,
				},
			},
			{
				...squat,
				variant: {
					id: 13,
					name: "Tempo Squat",
					setupDescription: "",
					environment: "Home",
					notes: "",
					ownerUserId: 7,
					isArchived: false,
				},
			},
		],
	});

	assert.deepEqual(form.fields.exerciseOptions, [
		{ label: "Squat — Barbell Back Squat", value: 11 },
		{ label: "Squat — Goblet Squat", value: 12 },
		{ label: "Squat — Tempo Squat (Private)", value: 13 },
	]);
	assert.equal(
		new Set(form.fields.exerciseOptions.map((option) => option.value)).size,
		form.fields.exerciseOptions.length,
	);
	assert.equal(
		new Set(form.fields.exerciseOptions.map((option) => option.label)).size,
		form.fields.exerciseOptions.length,
	);
});
