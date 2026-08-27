import { z } from "zod";
import { positiveId as id } from "./idSchemas.js";

const requiredTrimmedString = (message) =>
	z.preprocess(
		(value) => (typeof value === "string" ? value : ""),
		z.string().trim().min(1, message),
	);

const positiveId = (label) => id(`Choose ${label}.`);

function isCalendarDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return (
		date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day
	);
}

const optionalStartDate = z.preprocess(
	(value) => (typeof value === "string" ? value.trim() : ""),
	z
		.string()
		.refine(
			(value) => value === "" || isCalendarDate(value),
			"Enter a valid start date.",
		),
);

export const createProgramSchema = z.object({
	name: requiredTrimmedString("Enter a program name.").pipe(
		z.string().max(100, "Program name must be 100 characters or fewer."),
	),
	goalId: positiveId("a goal"),
	startDate: optionalStartDate,
});

export const createCycleSchema = z.object({
	name: requiredTrimmedString("Enter a cycle name.").pipe(
		z.string().max(100, "Cycle name must be 100 characters or fewer."),
	),
	cycleSize: z.coerce
		.number({ error: "Enter the number of days." })
		.int("Number of days must be a whole number.")
		.positive("Number of days must be at least 1."),
	cycleOrder: z.coerce
		.number({ error: "Choose a position." })
		.int("Choose a valid position.")
		.positive("Choose a valid position."),
});

export const programParamsSchema = z.object({
	programId: id("Choose a valid program."),
});

export const cycleParamsSchema = z.object({
	cycleId: id("Choose a valid cycle."),
});
