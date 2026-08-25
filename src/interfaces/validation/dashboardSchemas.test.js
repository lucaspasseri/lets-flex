import test from "node:test";
import assert from "node:assert/strict";
import {
	dashboardQuerySchema,
	performWorkoutStepLogBodySchema,
	workoutSessionActionParamsSchema,
} from "./dashboardSchemas.js";

test("dashboard query coerces known values and removes unknown input", () => {
	assert.deepEqual(
		dashboardQuerySchema.parse({
			daysDifference: "-2",
			workoutSessionId: "9",
			unexpected: "discarded",
		}),
		{ daysDifference: -2, workoutSessionId: 9 },
	);
});

test("dashboard query rejects unsafe date offsets and invalid IDs", () => {
	const result = dashboardQuerySchema.safeParse({
		daysDifference: "999999999",
		workoutSessionId: "1 OR 1=1",
	});
	assert.equal(result.success, false);
	assert.deepEqual(
		new Set(result.error.issues.map((issue) => issue.path[0])),
		new Set(["daysDifference", "workoutSessionId"]),
	);
	assert.equal(
		workoutSessionActionParamsSchema.safeParse({ workoutSessionId: "0" }).success,
		false,
	);
});

test("perform log schema normalizes numeric input and blank optional measurements", () => {
	assert.deepEqual(
		performWorkoutStepLogBodySchema.parse({
			daysDifference: "1",
			workoutSessionId: "5",
			logFormRows: [
				{
					performedReps: "12",
					performedLoadValue: "",
					performedLoadUnit: "Kilograms",
				},
			],
		}),
		{
			daysDifference: 1,
			workoutSessionId: 5,
			logFormRows: [
				{
					performedReps: 12,
					performedLoadValue: null,
					performedLoadUnit: "Kilograms",
				},
			],
		},
	);
});

test("perform log schema reports invalid set fields", () => {
	const result = performWorkoutStepLogBodySchema.safeParse({
		daysDifference: "today",
		workoutSessionId: "5",
		logFormRows: [
			{
				performedReps: "2.5",
				performedLoadValue: "-1",
				performedLoadUnit: "stone",
			},
		],
	});
	assert.equal(result.success, false);
	assert.deepEqual(
		new Set(result.error.issues.map((issue) => issue.path.join("."))),
		new Set([
			"daysDifference",
			"logFormRows.0.performedReps",
			"logFormRows.0.performedLoadValue",
			"logFormRows.0.performedLoadUnit",
		]),
	);
});
