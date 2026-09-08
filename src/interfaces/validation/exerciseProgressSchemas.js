import { z } from "zod";
import {
	DEFAULT_EXERCISE_PROGRESS_POINT_LIMIT,
	MAX_EXERCISE_PROGRESS_POINT_LIMIT,
} from "../../features/exerciseProgress/getExerciseProgress.js";
import { fromExerciseProgressKey } from "../../features/exerciseProgress/mapper.js";
import { positiveId } from "./idSchemas.js";

const optionalProgramId = z.preprocess(
	(value) => (value === "" || value == null ? null : value),
	positiveId("Choose a valid program.").nullable(),
);

const optionalExerciseKey = z.preprocess(
	(value) => (value === "" || value == null ? null : value),
	z
		.string({ error: "Choose a valid exercise." })
		.max(4096, "Choose a valid exercise.")
		.refine((value) => fromExerciseProgressKey(value) !== null, {
			message: "Choose a valid exercise.",
		})
		.nullable(),
);

const optionalDate = (message) =>
	z.preprocess(
		(value) => (value === "" || value == null ? null : value),
		z.iso.date({ error: message }).nullable(),
	);

const pointLimit = z.preprocess(
	(value) =>
		value === "" || value == null ? DEFAULT_EXERCISE_PROGRESS_POINT_LIMIT : value,
	z.coerce
		.number({ error: "Choose a valid result limit." })
		.int("Choose a valid result limit.")
		.min(1, "Choose a valid result limit.")
		.max(MAX_EXERCISE_PROGRESS_POINT_LIMIT, "Choose a valid result limit."),
);

export const exerciseProgressQuerySchema = z
	.object({
		programId: optionalProgramId,
		exerciseKey: optionalExerciseKey,
		fromDate: optionalDate("Choose a valid start date."),
		toDate: optionalDate("Choose a valid end date."),
		pointLimit,
	})
	.refine(
		(values) => !values.fromDate || !values.toDate || values.fromDate <= values.toDate,
		{
			message: "The start date must be on or before the end date.",
			path: ["fromDate"],
		},
	);
