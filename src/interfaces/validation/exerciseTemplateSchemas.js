import { z } from "zod";
import { positiveId } from "./idSchemas.js";

/** @param {string} label */
const requiredId = (label) => positiveId(`Choose ${label}.`);

const muscleRelationSchema = z.object({
	muscleId: requiredId("a muscle"),
	muscleRoleId: requiredId("a muscle role"),
});

const exerciseTemplateFields = {
	name: z.string().trim().min(1, "Enter an exercise name.").max(100),
	movementPatternId: requiredId("a movement pattern"),
	equipmentId: requiredId("equipment"),
	muscleGroup: z
		.array(muscleRelationSchema)
		.min(1, "Add at least one muscle relationship.")
		.superRefine((relations, context) => {
			const keys = new Set();
			for (const relation of relations) {
				const key = `${relation.muscleId}:${relation.muscleRoleId}`;
				if (keys.has(key)) {
					context.addIssue({
						code: "custom",
						message: "Remove duplicate muscle relationships.",
					});
					return;
				}
				keys.add(key);
			}
		}),
};

export const createExerciseTemplateSchema = z.object(exerciseTemplateFields);
export const updateExerciseTemplateSchema = z.object(exerciseTemplateFields);

export const exerciseTemplateParamsSchema = z.object({
	exerciseId: positiveId("Choose a valid exercise template."),
});

export const exerciseTemplateVariantParamsSchema = exerciseTemplateParamsSchema.extend({
	variantId: positiveId("Choose a valid exercise variant."),
});

export const privateVariantParamsSchema = z.object({
	variantId: positiveId("Choose a valid exercise variant."),
});

export const createPrivateVariantParamsSchema = z.object({
	exerciseId: positiveId("Choose a valid exercise."),
});

export const privateVariantBodySchema = z.object({
	name: z.string().trim().min(1, "Enter a variant name.").max(100),
	equipmentId: z.preprocess(
		(value) => (value === "" || value == null ? null : value),
		z.coerce.number().int().positive().nullable(),
	),
});
