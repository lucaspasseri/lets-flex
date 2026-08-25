import test from "node:test";
import assert from "node:assert/strict";
import { updateSessionTemplateSchema } from "./sessionTemplateSchemas.js";

test("session update validation normalizes an ordered session aggregate", () => {
	const value = updateSessionTemplateSchema.parse({
		name: "  Upper body  ",
		notes: "  Main day  ",
		stepRow: [{
			stepId: "8",
			stepTypeId: "1",
			exerciseVariantId: "4",
			sets: "3",
			reps: "10",
			loadValue: "42.5",
			loadUnit: "Kilograms",
		}],
	});
	assert.deepEqual(value, {
		name: "Upper body",
		notes: "Main day",
		stepRow: [{ stepId: 8, stepTypeId: 1, exerciseVariantId: 4, sets: 3, reps: 10, loadValue: 42.5, loadUnit: "Kilograms" }],
	});
});

test("session update validation rejects invalid data and duplicate step identities", () => {
	const step = { stepId: "8", stepTypeId: "1", exerciseVariantId: "4", sets: "-1", reps: "10", loadValue: "0", loadUnit: "stones" };
	const result = updateSessionTemplateSchema.safeParse({ name: "", notes: "", stepRow: [step, step] });
	assert.equal(result.success, false);
	const fields = result.error.flatten().fieldErrors;
	assert.ok(fields.name);
	assert.ok(fields.stepRow);
});

test("session update validation permits removing every step", () => {
	const value = updateSessionTemplateSchema.parse({ name: "Recovery", notes: "", stepRow: undefined });
	assert.deepEqual(value, { name: "Recovery", notes: null, stepRow: [] });
});
