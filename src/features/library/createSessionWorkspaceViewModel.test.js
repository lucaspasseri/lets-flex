import assert from "node:assert/strict";
import test from "node:test";

import createSessionWorkspace from "./createSessionWorkspaceViewModel.js";

function session({ id, name, movement, equipment, muscle, notes, variantName }) {
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
				exercise: {
					name: movement,
					variantName,
					setupDescription: "Brace first",
					environment: "gym_or_home",
					notes: "Controlled tempo",
				},
				equipment: equipment ? { name: equipment, category: "Free weight" } : {},
				muscles: [
					{
						commonName: muscle,
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
