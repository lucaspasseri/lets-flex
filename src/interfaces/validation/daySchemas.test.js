import test from "node:test";
import assert from "node:assert/strict";
import {
	cancelWorkoutSessionSchema,
	createWorkoutSessionSchema,
	dayPageQuerySchema,
	workoutSessionParamsSchema,
} from "./daySchemas.js";

test("day query trims its shape and parses a positive integer ID", () => {
	const result = dayPageQuerySchema.parse({ dayId: "12", ignored: "value" });
	assert.deepEqual(result, { dayId: 12 });
	assert.deepEqual(dayPageQuerySchema.parse({}), {});
});

test("day query rejects malformed, fractional, and non-positive IDs", () => {
	for (const dayId of ["abc", "1.5", "0", "-2"]) {
		assert.equal(dayPageQuerySchema.safeParse({ dayId }).success, false);
	}
});

test("workout-session forms parse IDs and remove unexpected fields", () => {
	assert.deepEqual(
		createWorkoutSessionSchema.parse({
			sessionId: "4",
			trainingDayId: "9",
			admin: "true",
		}),
		{ sessionId: 4, trainingDayId: 9 },
	);
	assert.deepEqual(cancelWorkoutSessionSchema.parse({ trainingDayId: "9" }), {
		trainingDayId: 9,
	});
	assert.deepEqual(workoutSessionParamsSchema.parse({ workoutSessionId: "3" }), {
		workoutSessionId: 3,
	});
});

test("workout-session forms reject missing and invalid IDs", () => {
	assert.equal(createWorkoutSessionSchema.safeParse({}).success, false);
	assert.equal(
		createWorkoutSessionSchema.safeParse({
			sessionId: "<script>",
			trainingDayId: "9",
		}).success,
		false,
	);
	assert.equal(
		cancelWorkoutSessionSchema.safeParse({ trainingDayId: "Infinity" }).success,
		false,
	);
});
