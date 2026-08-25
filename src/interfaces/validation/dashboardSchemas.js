import { z } from "zod";

const positiveId = (message) =>
	z.coerce.number({ error: message }).int(message).positive(message);

const optionalPositiveId = (message) =>
	z.preprocess(
		(value) => (value === "" || value == null ? undefined : value),
		positiveId(message).optional(),
	);

const daysDifference = z.coerce
	.number({ error: "Choose a valid day." })
	.int("Choose a valid day.")
	.min(-3650, "Choose a day within 10 years of today.")
	.max(3650, "Choose a day within 10 years of today.");

const optionalDaysDifference = z.preprocess(
	(value) => (value === "" || value == null ? undefined : value),
	daysDifference.optional(),
);

export const dashboardQuerySchema = z.object({
	daysDifference: optionalDaysDifference,
	workoutSessionId: optionalPositiveId("Choose a valid workout session."),
});

export const workoutSessionActionParamsSchema = z.object({
	workoutSessionId: positiveId("Choose a valid workout session."),
});

export const workoutStepLogActionParamsSchema = z.object({
	workoutStepLogId: positiveId("Choose a valid workout step."),
});

export const dashboardActionBodySchema = z.object({
	daysDifference: optionalDaysDifference,
});

export const dashboardStepActionBodySchema = dashboardActionBodySchema.extend({
	workoutSessionId: positiveId("Choose a valid workout session."),
});

const nullableNumber = (schema) =>
	z.preprocess(
		(value) => (value === "" || value == null ? null : value),
		schema.nullable(),
	);

const workoutSetSchema = z.object({
	performedReps: nullableNumber(
		z.coerce
			.number({ error: "Enter a valid number of reps." })
			.int("Reps must be a whole number.")
			.min(0, "Reps cannot be negative.")
			.max(10000, "Reps must be 10,000 or fewer."),
	),
	performedLoadValue: nullableNumber(
		z.coerce
			.number({ error: "Enter a valid load." })
			.min(0, "Load cannot be negative.")
			.max(1000000, "Load must be 1,000,000 or less."),
	),
	performedLoadUnit: z.enum(["Kilograms", "Libra"], {
		error: "Choose a valid load unit.",
	}),
});

export const performWorkoutStepLogBodySchema = dashboardStepActionBodySchema.extend({
	logFormRows: z
		.array(workoutSetSchema, { error: "Add at least one set." })
		.min(1, "Add at least one set.")
		.max(100, "A step cannot contain more than 100 sets."),
});
