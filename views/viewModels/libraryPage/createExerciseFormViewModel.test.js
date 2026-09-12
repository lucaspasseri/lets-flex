import assert from "node:assert/strict";
import test from "node:test";

import createExerciseFormViewModel from "./createExerciseFormViewModel.js";

test("exercise catalog forms present localized labels with stable relationship IDs", () => {
	const form = createExerciseFormViewModel({
		equipments: [{ id: 7, name: "Barra", category: "Peso livre" }],
		movementPatterns: [{ id: 8, name: "Empurrar", notes: "" }],
		muscles: [
			{
				id: 9,
				commonName: "Peitoral",
				scientificName: "Pectoralis major",
				bodyPart: "Tronco",
				referenceUrl: "",
			},
		],
		muscleRoles: [{ id: 10, name: "Motor principal", description: "" }],
	});

	assert.deepEqual(form.fields.movementPatternOptions, [
		{ label: "Empurrar", value: 8 },
	]);
	assert.deepEqual(form.fields.equipmentOptions, [{ label: "Barra", value: 7 }]);
	assert.deepEqual(form.fields.muscleOptions, [
		{ label: "Peitoral (Pectoralis major)", value: 9 },
	]);
	assert.deepEqual(form.fields.muscleRoleOptions, [
		{ label: "Motor principal", value: 10 },
	]);
});
