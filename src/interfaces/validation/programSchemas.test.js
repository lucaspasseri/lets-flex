import test from "node:test";
import assert from "node:assert/strict";
import { createCycleSchema, createProgramSchema } from "./programSchemas.js";

test("program validation sanitizes and transforms valid form input", () => {
	assert.deepEqual(
		createProgramSchema.parse({
			name: "  Strength block  ",
			goalId: "7",
			startDate: " 2026-08-25 ",
			ignored: "discarded",
		}),
		{ name: "Strength block", goalId: 7, startDate: "2026-08-25" },
	);

	assert.equal(
		createProgramSchema.parse({ name: "Base", goalId: "1", startDate: "" }).startDate,
		"",
	);
});

test("program validation reports each invalid field and rejects impossible dates", () => {
	const result = createProgramSchema.safeParse({
		name: "   ",
		goalId: "",
		startDate: "2026-02-30",
	});

	assert.equal(result.success, false);
	assert.deepEqual(Object.keys(result.error.flatten().fieldErrors).sort(), [
		"goalId",
		"name",
		"startDate",
	]);
});

test("cycle validation trims text and coerces whole positive numbers", () => {
	assert.deepEqual(
		createCycleSchema.parse({
			name: "  Foundation  ",
			cycleSize: "14",
			cycleOrder: "2",
		}),
		{ name: "Foundation", cycleSize: 14, cycleOrder: 2 },
	);
});

test("cycle validation rejects missing, fractional, negative, and oversized values", () => {
	for (const body of [
		{ name: "", cycleSize: "", cycleOrder: "" },
		{ name: "A".repeat(101), cycleSize: "1.5", cycleOrder: "1" },
		{ name: "Base", cycleSize: "-1", cycleOrder: "0" },
	]) {
		assert.equal(createCycleSchema.safeParse(body).success, false);
	}
});
