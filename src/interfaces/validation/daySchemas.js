import { z } from "zod";

const positiveId = (message) =>
	z.coerce.number({ error: message }).int(message).positive(message);

const optionalPositiveId = (message) =>
	z.preprocess(
		(value) => (value === "" || value == null ? undefined : value),
		positiveId(message).optional(),
	);

export const dayPageQuerySchema = z.object({
	dayId: optionalPositiveId("Choose a valid training day."),
});

export const createWorkoutSessionSchema = z.object({
	sessionId: positiveId("Choose a valid session template."),
	trainingDayId: positiveId("Choose a valid training day."),
});

export const cancelWorkoutSessionSchema = z.object({
	trainingDayId: positiveId("Choose a valid training day."),
});

export const workoutSessionParamsSchema = z.object({
	workoutSessionId: positiveId("Choose a valid workout session."),
});
