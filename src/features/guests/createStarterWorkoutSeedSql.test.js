import test from "node:test";
import assert from "node:assert/strict";

import { catalogManifest } from "../exerciseCatalog/catalogManifest.js";
import {
	createStarterWorkoutSeedSql,
	starterWorkoutSeedSql,
} from "./createStarterWorkoutSeedSql.js";
import { starterWorkoutManifest } from "./starterWorkoutManifest.js";

test("starter workout is a short ordered full-body catalog sequence", () => {
	assert.deepEqual(starterWorkoutManifest.steps, [
		{
			name: "Box squats",
			variantName: "Bodyweight Box Squat",
			sets: 3,
			reps: 10,
		},
		{
			name: "Push ups",
			variantName: "Bodyweight Push Up",
			sets: 3,
			reps: 10,
		},
		{
			name: "One-arm rows",
			variantName: "One-Arm Dumbbell Row",
			sets: 3,
			reps: 10,
		},
		{
			name: "Glute bridges",
			variantName: "Bodyweight Glute Bridge",
			sets: 3,
			reps: 12,
		},
	]);
	assert.equal(
		new Set(starterWorkoutManifest.steps.map((step) => step.variantName)).size,
		4,
	);
	assert.match(starterWorkoutSeedSql, /starter\.step_order/);
});

test("starter seed rejects unknown and duplicate catalog variants", () => {
	const unknown = {
		...starterWorkoutManifest,
		steps: [
			...starterWorkoutManifest.steps.slice(0, 3),
			{
				...starterWorkoutManifest.steps[3],
				variantName: "Imaginary Exercise",
			},
		],
	};
	assert.throws(
		() => createStarterWorkoutSeedSql(unknown, catalogManifest),
		/Unknown starter workout variant/,
	);

	const duplicate = {
		...starterWorkoutManifest,
		steps: [
			...starterWorkoutManifest.steps.slice(0, 3),
			{ ...starterWorkoutManifest.steps[3], variantName: "Bodyweight Push Up" },
		],
	};
	assert.throws(
		() => createStarterWorkoutSeedSql(duplicate, catalogManifest),
		/Duplicate starter workout variant/,
	);
});
