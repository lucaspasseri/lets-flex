import test from "node:test";
import assert from "node:assert/strict";

import { catalogManifest } from "../exerciseCatalog/catalogManifest.js";
import {
	createStarterWorkoutSeedSql,
	starterWorkoutSeedSql,
} from "./createStarterWorkoutSeedSql.js";
import { starterWorkoutManifest } from "../starterTraining/starterWorkoutManifest.js";

test("starter workout is a short ordered full-body catalog sequence", () => {
	assert.deepEqual(starterWorkoutManifest.steps, [
		{
			name: "Box squats",
			variantCatalogKey: "bodyweight-box-squat",
			sets: 3,
			reps: 10,
		},
		{
			name: "Push ups",
			variantCatalogKey: "bodyweight-push-up",
			sets: 3,
			reps: 10,
		},
		{
			name: "One-arm rows",
			variantCatalogKey: "one-arm-dumbbell-row",
			sets: 3,
			reps: 10,
		},
		{
			name: "Glute bridges",
			variantCatalogKey: "bodyweight-glute-bridge",
			sets: 3,
			reps: 12,
		},
	]);
	assert.equal(
		new Set(starterWorkoutManifest.steps.map((step) => step.variantCatalogKey)).size,
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
				variantCatalogKey: "imaginary-exercise",
			},
		],
	};
	assert.throws(
		() => createStarterWorkoutSeedSql(unknown, catalogManifest),
		/Unknown starter workout variant catalog key/,
	);

	const duplicate = {
		...starterWorkoutManifest,
		steps: [
			...starterWorkoutManifest.steps.slice(0, 3),
			{
				...starterWorkoutManifest.steps[3],
				variantCatalogKey: "bodyweight-push-up",
			},
		],
	};
	assert.throws(
		() => createStarterWorkoutSeedSql(duplicate, catalogManifest),
		/Duplicate starter workout variant catalog key/,
	);
});
