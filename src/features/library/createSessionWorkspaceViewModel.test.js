import assert from "node:assert/strict";
import test from "node:test";

import createSessionWorkspace from "./createSessionWorkspaceViewModel.js";

function session({
	id,
	name,
	movement,
	canonicalMovement = movement,
	equipment,
	canonicalEquipment = equipment,
	muscle,
	canonicalMuscle = muscle,
	notes,
	variantName,
	canonicalVariantName = variantName,
	canonicalExerciseName = movement,
}) {
	return /** @type {any} */ ({
		id,
		name,
		notes,
		isArchived: false,
		ownerUserId: 7,
		steps: [
			{
				id: id * 10,
				name: "Working set",
				order: 1,
				type: "Exercise",
				sets: 3,
				reps: 8,
				loadValue: 40,
				loadUnit: "kg",
				movementPattern: movement,
				canonicalMovementPattern: canonicalMovement,
				exercise: {
					name: movement,
					canonicalName: canonicalExerciseName,
					variantName,
					canonicalVariantName,
					setupDescription: "Brace first",
					environment: "gym_or_home",
					notes: "Controlled tempo",
				},
				equipment: equipment
					? {
							name: equipment,
							canonicalName: canonicalEquipment,
							category: "Free weight",
						}
					: {},
				muscles: [
					{
						commonName: muscle,
						canonicalCommonName: canonicalMuscle,
						scientificName: `${muscle} scientific`,
						bodyPart: "Torso",
					},
				],
			},
		],
	});
}

test("session discovery derives useful facets and searchable loaded metadata", () => {
	const viewModel = createSessionWorkspace({
		sessionArr: [
			session({
				id: 1,
				name: "Lower strength",
				movement: "Squat",
				equipment: "Barbell",
				muscle: "Quadriceps",
				notes: "Heavy training day",
				variantName: "Back squat",
			}),
			session({
				id: 2,
				name: "Upper strength",
				movement: "Push",
				equipment: null,
				muscle: "Chest",
				notes: "Technique work",
				variantName: "Push-up",
			}),
		],
		activeSession: null,
		actorUserId: 7,
	});

	assert.deepEqual(
		viewModel.discovery.filters.map((filter) => ({
			name: filter.name,
			options: filter.options.map((option) => option.label),
		})),
		[
			{ name: "movement", options: ["Push", "Squat"] },
			{ name: "muscle", options: ["Chest", "Quadriceps"] },
			{ name: "equipment", options: ["Barbell", "Bodyweight"] },
		],
	);
	assert.match(viewModel.summaries.items[0].searchKeyWord, /Heavy training day/);
	assert.match(viewModel.summaries.items[0].searchKeyWord, /Back squat/);
	assert.match(viewModel.summaries.items[0].searchKeyWord, /Controlled tempo/);
	assert.equal(viewModel.summaries.items[0].media?.src, null);
	assert.equal(viewModel.summaries.items[0].media?.initial, "L");
	assert.deepEqual(viewModel.summaries.items[1].filters.equipment, ["Bodyweight"]);
});

test("session discovery omits facets that cannot narrow the visible collection", () => {
	const viewModel = createSessionWorkspace({
		sessionArr: [
			session({
				id: 1,
				name: "Only session",
				movement: "Squat",
				equipment: "Barbell",
				muscle: "Quadriceps",
				notes: "",
				variantName: "Back squat",
			}),
		],
		activeSession: null,
		actorUserId: 7,
	});

	assert.deepEqual(viewModel.discovery.filters, []);
});

test("session discovery keeps English catalog names searchable under a localized display", () => {
	const viewModel = createSessionWorkspace({
		sessionArr: [
			session({
				id: 1,
				name: "Força inferior",
				movement: "Agachamento",
				canonicalMovement: "Squat",
				equipment: "Barra",
				canonicalEquipment: "Barbell",
				muscle: "Quadríceps",
				canonicalMuscle: "Quadriceps",
				variantName: "Agachamento com barra",
				canonicalVariantName: "Barbell back squat",
				canonicalExerciseName: "Squat",
				notes: "Técnica",
			}),
		],
		activeSession: null,
		actorUserId: 7,
	});

	const summary = viewModel.summaries.items[0];
	assert.match(summary.searchKeyWord, /Agachamento/);
	assert.match(summary.searchKeyWord, /Squat/);
	assert.match(summary.searchKeyWord, /Barbell back squat/);
	assert.deepEqual(summary.filters, {
		movement: ["Agachamento"],
		muscle: ["Quadríceps"],
		equipment: ["Barra"],
	});
});

test("session discovery preserves large collections and long names for the scrollable list", () => {
	const longName = "Strength block with a deliberately long training session name";
	const viewModel = createSessionWorkspace({
		sessionArr: Array.from({ length: 80 }, (_, index) =>
			session({
				id: index + 1,
				name: index === 0 ? longName : `Session ${index + 1}`,
				movement: "Squat",
				equipment: "Barbell",
				muscle: "Quads",
				notes: "Keep the setup consistent.",
				variantName: "Barbell Back Squat",
			}),
		),
		activeSession: null,
		actorUserId: 7,
	});

	assert.equal(viewModel.summaries.items.length, 80);
	assert.equal(viewModel.summaries.items[0].name, longName);
	assert.equal(viewModel.summaries.items.at(-1)?.href, "/library?sessionId=80");
});
