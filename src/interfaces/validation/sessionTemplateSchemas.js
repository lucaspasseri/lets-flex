import { z } from "zod";
import { positiveId as id } from "./idSchemas.js";

/** @param {string} label */
const positiveId = (label) => id(`Choose ${label}.`);

const optionalStepId = z.preprocess(
	(value) => (value === "" || value == null ? undefined : value),
	z.coerce.number().int().positive().optional(),
);

const sessionStepSchema = z.object({
	stepId: optionalStepId,
	stepTypeId: positiveId("a step type"),
	exerciseVariantId: positiveId("an exercise"),
	sets: z.coerce.number().int().nonnegative(),
	reps: z.coerce.number().int().nonnegative(),
	loadValue: z.coerce.number().nonnegative(),
	loadUnit: z.enum(["Kilograms", "Pounds"]),
});

const createSessionStepSchema = sessionStepSchema.omit({ stepId: true });

const stepRows = z.preprocess(
	(value) => (value == null ? [] : value),
	z.array(sessionStepSchema).superRefine((steps, context) => {
		const ids = new Set();
		for (const step of steps) {
			if (step.stepId == null) continue;
			if (ids.has(step.stepId)) {
				context.addIssue({
					code: "custom",
					message: "A session step cannot appear more than once.",
				});
				return;
			}
			ids.add(step.stepId);
		}
	}),
);

export const updateSessionTemplateSchema = z.object({
	name: z.string().trim().min(1, "Enter a session name.").max(100),
	notes: z
		.string()
		.trim()
		.max(500)
		.transform((value) => value || null),
	stepRow: stepRows,
});

export const createSessionTemplateSchema = updateSessionTemplateSchema.extend({
	stepRow: z.preprocess(
		(value) => (value == null ? [] : value),
		z.array(createSessionStepSchema),
	),
});

export const sessionTemplateParamsSchema = z.object({
	sessionId: id("Choose a valid session template."),
});
