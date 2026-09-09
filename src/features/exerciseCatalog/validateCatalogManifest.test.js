import assert from "node:assert/strict";
import test from "node:test";

import {
	catalogManifest,
	catalogReviewNotes,
	catalogVocabulary,
} from "./catalogManifest.js";
import { validateCatalogManifest } from "./validateCatalogManifest.js";

const cloneManifest = () => structuredClone(catalogManifest);

test("canonical catalog satisfies the approved manifest contract", () => {
	const result = validateCatalogManifest(catalogManifest, catalogVocabulary);

	assert.deepEqual(result, {
		baseCount: 18,
		variantCount: 36,
		patternCounts: {
			push: 3,
			pull: 4,
			squat: 3,
			hinge: 3,
			lunge: 3,
			rotation: 2,
		},
	});
	assert.ok(catalogReviewNotes.length > 0);
});

test("canonical catalog identifies and enriches the existing sample entries", () => {
	const pushUp = catalogManifest.find((exercise) => exercise.name === "Push Up");
	const squat = catalogManifest.find((exercise) => exercise.name === "Squat");

	assert.ok(pushUp?.variants.some((variant) => variant.name === "Bodyweight Push Up"));
	assert.ok(squat?.variants.some((variant) => variant.name === "Barbell Back Squat"));
	assert.equal(
		pushUp?.variants.find((variant) => variant.name === "Bodyweight Push Up")
			?.equipment,
		null,
	);
});

test("canonical catalog covers approved equipment and foundational use cases", () => {
	const bases = new Set(catalogManifest.map((exercise) => exercise.name));
	const equipment = new Set(
		catalogManifest.flatMap((exercise) =>
			exercise.variants.map((variant) => variant.equipment),
		),
	);

	for (const requiredEquipment of [
		null,
		"Barbell",
		"Dumbbell",
		"Kettlebell",
		"Cable Machine",
		"Resistance Band",
		"Leg Press Machine",
		"Lat Pulldown Machine",
	]) {
		assert.ok(equipment.has(requiredEquipment));
	}

	for (const requiredBase of [
		"Bench Press",
		"Overhead Press",
		"Pull Up",
		"Row",
		"Leg Press",
		"Deadlift",
		"Hip Extension",
		"Forward Lunge",
		"Split Squat",
		"Wood Chop",
		"Anti-Rotation Press",
	]) {
		assert.ok(bases.has(requiredBase));
	}
	assert.ok(
		catalogManifest
			.find((exercise) => exercise.name === "Leg Press")
			?.variants.some((variant) => variant.name === "Single-Leg Press"),
	);
});

test("validation rejects unresolved vocabulary references and missing metadata", () => {
	const unknownReference = cloneManifest();
	unknownReference[0].movementPattern = "press";
	assert.throws(
		() => validateCatalogManifest(unknownReference, catalogVocabulary),
		/Unknown movement pattern/,
	);

	const missingPrimeMover = cloneManifest();
	missingPrimeMover[0].muscles = [{ name: "Chest", role: "synergist" }];
	assert.throws(
		() => validateCatalogManifest(missingPrimeMover, catalogVocabulary),
		/must have a prime mover/,
	);

	const missingSetup = cloneManifest();
	missingSetup[0].variants[0].setupDescription = "";
	assert.throws(
		() => validateCatalogManifest(missingSetup, catalogVocabulary),
		/setup description must be a non-empty trimmed string/,
	);
});

test("validation rejects exact and normalized duplicate names", () => {
	const exactDuplicate = cloneManifest();
	exactDuplicate[1].variants[0].name = exactDuplicate[0].variants[0].name;
	assert.throws(
		() => validateCatalogManifest(exactDuplicate, catalogVocabulary),
		/Duplicate global variant name/,
	);

	const normalizedDuplicate = cloneManifest();
	normalizedDuplicate[1].name = "Push-Up";
	assert.throws(
		() => validateCatalogManifest(normalizedDuplicate, catalogVocabulary),
		/Normalized duplicate base exercise names/,
	);
});

test("validation rejects an incomplete pattern distribution", () => {
	const invalidDistribution = cloneManifest();
	invalidDistribution[0].movementPattern = "pull";

	assert.throws(
		() => validateCatalogManifest(invalidDistribution, catalogVocabulary),
		/Catalog must contain exactly 3 push base exercises/,
	);
});
