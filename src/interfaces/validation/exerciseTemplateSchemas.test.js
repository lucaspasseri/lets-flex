import test from "node:test";
import assert from "node:assert/strict";
import { updateExerciseTemplateSchema } from "./exerciseTemplateSchemas.js";

test("update exercise template validation normalizes valid form values", () => {
	const result = updateExerciseTemplateSchema.parse({
		name: "  Incline press  ",
		movementPatternId: "2",
		equipmentId: "3",
		muscleGroup: [{ muscleId: "4", muscleRoleId: "1" }],
	});

	assert.deepEqual(result, {
		name: "Incline press",
		movementPatternId: 2,
		equipmentId: 3,
		muscleGroup: [{ muscleId: 4, muscleRoleId: 1 }],
	});
});

test("update exercise template validation rejects missing fields and muscles", () => {
	const result = updateExerciseTemplateSchema.safeParse({
		name: "",
		movementPatternId: "",
		equipmentId: "",
	});

	assert.equal(result.success, false);
	const fields = result.error.flatten().fieldErrors;
	assert.ok(fields.name);
	assert.ok(fields.movementPatternId);
	assert.ok(fields.equipmentId);
	assert.ok(fields.muscleGroup);
});
