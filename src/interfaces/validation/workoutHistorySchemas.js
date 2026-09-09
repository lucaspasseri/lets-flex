import { z } from "zod";
import { MAX_HISTORY_PAGE } from "../../features/workoutHistory/getWorkoutHistoryPage.js";
import { positiveId } from "./idSchemas.js";

const optionalPositiveId = z.preprocess(
	(value) => (value === "" || value == null ? null : value),
	positiveId("Choose a valid program.").nullable(),
);

const optionalDate = (message) =>
	z.preprocess(
		(value) => (value === "" || value == null ? null : value),
		z.iso.date({ error: message }).nullable(),
	);

const page = z.preprocess(
	(value) => (value === "" || value == null ? 1 : value),
	z.coerce
		.number({ error: "Choose a valid history page." })
		.int("Choose a valid history page.")
		.min(1, "Choose a valid history page.")
		.max(MAX_HISTORY_PAGE, "Choose a valid history page."),
);

export const workoutHistoryQuerySchema = z
	.object({
		programId: optionalPositiveId,
		fromDate: optionalDate("Choose a valid start date."),
		toDate: optionalDate("Choose a valid end date."),
		page,
	})
	.refine(
		(values) => !values.fromDate || !values.toDate || values.fromDate <= values.toDate,
		{
			message: "The start date must be on or before the end date.",
			path: ["fromDate"],
		},
	);

export const workoutHistoryParamsSchema = z.object({
	workoutSessionId: positiveId("Choose a valid workout history entry."),
});
