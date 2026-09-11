import assert from "node:assert/strict";
import test from "node:test";

import { catalogManifest } from "../exerciseCatalog/catalogManifest.js";
import createExerciseTemplates from "./createExerciseTemplatesViewModel.js";

/**
 * @param {{exerciseId: number, baseName: string, variantId: number, variantName: string, ownerUserId?: number | null, equipmentName?: string | null, environment?: string}} input
 */
function exerciseTemplate({
	exerciseId,
	baseName,
	variantId,
	variantName,
	ownerUserId = null,
	equipmentName = "Barbell",
	environment = "gym",
}) {
	return /** @type {any} */ ({
		id: exerciseId,
		name: baseName,
		movementPattern: { id: 1, name: "Push", notes: "Press away" },
		equipment: equipmentName
			? { id: 1, name: equipmentName, category: "Free weight" }
			: { id: null, name: null, category: null },
		variant: {
			id: variantId,
			name: variantName,
			setupDescription: "Brace before starting.",
			environment,
			notes: "Controlled tempo.",
			ownerUserId,
			isArchived: false,
		},
		muscles: [
			{
				id: 1,
				commonName: "Chest",
				scientificName: "Pectoralis major",
				bodyRegion: "Torso",
				referenceUrl: "",
				role: { id: 1, name: "Prime mover", description: "" },
			},
		],
	});
}

test("exercise catalog groups, orders, and counts visible variants by base exercise", () => {
	const viewModel = createExerciseTemplates({
		exerciseTemplateArr: [
			exerciseTemplate({
				exerciseId: 2,
				baseName: "Squat",
				variantId: 22,
				variantName: "Tempo squat",
				ownerUserId: 7,
				equipmentName: "Dumbbell",
			}),
			exerciseTemplate({
				exerciseId: 1,
				baseName: "Bench press",
				variantId: 10,
				variantName: "Barbell bench press",
			}),
			exerciseTemplate({
				exerciseId: 2,
				baseName: "Squat",
				variantId: 20,
				variantName: "Barbell back squat",
			}),
		],
		actorUserId: 7,
		managementMode: false,
	});

	assert.equal(viewModel.count, 2);
	assert.equal(viewModel.variantCount, 3);
	assert.equal(viewModel.countLabel, "2 exercises · 3 variants");
	assert.deepEqual(
		viewModel.items.map((item) => item.baseName),
		["Bench press", "Squat"],
	);
	assert.deepEqual(
		viewModel.items[1].details.variants.map((variant) => variant.name),
		["Barbell back squat", "Tempo squat"],
	);
	assert.equal(viewModel.items[1].details.variants[1].isPrivateOwner, true);
	assert.equal(viewModel.items[1].details.variants[1].actions.canManagePrivate, true);
	assert.equal(viewModel.items[1].actions.archive, null);
	assert.equal(viewModel.items[0].details.media.src, null);
	assert.equal(viewModel.items[0].details.media.initial, "B");
	assert.equal(viewModel.items[0].details.variants[0].media.src, null);
	assert.equal(viewModel.items[0].details.variants[0].media.initial, "B");
	assert.match(viewModel.items[1].searchKeyWord, /Chest/);
	assert.match(viewModel.items[1].searchKeyWord, /Controlled tempo/);
	assert.match(viewModel.items[1].searchKeyWord, /Private/);
	assert.deepEqual(viewModel.items[1].filters.movement, ["Push"]);
	assert.deepEqual(viewModel.items[1].details.variants[1].filters, {
		equipment: ["Dumbbell"],
		environment: ["Gym"],
		scope: ["Private"],
	});
	assert.deepEqual(
		viewModel.discovery.filters.map((filter) => filter.name),
		["equipment", "scope"],
	);
});

test("administrator grouping keeps variant edit identities and one base archive action", () => {
	const viewModel = createExerciseTemplates({
		exerciseTemplateArr: [
			exerciseTemplate({
				exerciseId: 4,
				baseName: "Row",
				variantId: 41,
				variantName: "Dumbbell row",
			}),
			exerciseTemplate({
				exerciseId: 4,
				baseName: "Row",
				variantId: 42,
				variantName: "Barbell row",
			}),
		],
		actorUserId: 1,
		managementMode: true,
	});

	assert.equal(viewModel.items.length, 1);
	assert.deepEqual(viewModel.items[0].actions.archive, {
		label: "Archive Row",
		modalId: "deleteExerciseModal",
		value: 4,
	});
	assert.deepEqual(
		viewModel.items[0].details.variants.map((variant) => ({
			id: variant.id,
			exerciseId: variant.actions.update.values.exerciseId,
			variantId: variant.actions.update.values.variantId,
			canManageGlobal: variant.actions.canManageGlobal,
		})),
		[
			{ id: 42, exerciseId: 4, variantId: 42, canManageGlobal: true },
			{ id: 41, exerciseId: 4, variantId: 41, canManageGlobal: true },
		],
	);
});

test("canonical catalog projects 78 base exercises and 129 nested variants", () => {
	let nextVariantId = 1;
	const exerciseTemplateArr = catalogManifest.flatMap((exercise, exerciseIndex) =>
		exercise.variants.map((variant) =>
			exerciseTemplate({
				exerciseId: exerciseIndex + 1,
				baseName: exercise.name,
				variantId: nextVariantId++,
				variantName: variant.name,
				equipmentName: variant.equipment,
				environment: variant.environment,
			}),
		),
	);
	const viewModel = createExerciseTemplates({
		exerciseTemplateArr,
		actorUserId: 1,
		managementMode: true,
	});

	assert.equal(viewModel.count, 78);
	assert.equal(viewModel.variantCount, 129);
	assert.equal(viewModel.items.length, 78);
	assert.equal(
		viewModel.items.reduce((total, item) => total + item.details.variants.length, 0),
		129,
	);
	const boxSquat = viewModel.items.find((item) => item.baseName === "Box Squat");
	assert.ok(boxSquat);
	assert.match(boxSquat.summary.equipmentSummary, /Bodyweight/);
	assert.ok(
		viewModel.items.some((item) =>
			item.details.variants.some(
				(variant) => variant.environmentLabel === "Gym or home",
			),
		),
	);
});
