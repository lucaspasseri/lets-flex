import { z } from "zod";

/** @param {string} label */
const requiredId = (label) =>
	z.coerce
		.number({ error: `Choose ${label}.` })
		.int()
		.positive(`Choose ${label}.`);

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
