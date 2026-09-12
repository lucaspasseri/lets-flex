import pool from "../../../db/pool.js";
import * as exercisesRepository from "../exercises/repository.js";
import * as exerciseMusclesRepository from "../exerciseMuscles/repository.js";
import * as exerciseVariantsRepository from "../exerciseVariants/repository.js";
import * as translationMaintenanceRepository from "../translationMaintenance/repository.js";

export class ExerciseTemplateNotFoundError extends Error {
	constructor() {
		super("Exercise template not found");
		this.name = "ExerciseTemplateNotFoundError";
	}
}

const defaultDependencies = {
	pool,
	exercisesRepository,
	exerciseMusclesRepository,
	exerciseVariantsRepository,
	translationMaintenanceRepository,
};

/**
 * @param {{exerciseId: number, variantId: number, name: string, movementPatternId: number, equipmentId: number | null, muscleGroup: Array<{muscleId: number, muscleRoleId: number}>}} input
 * @param {any} dependencies
 */
export async function updateExerciseTemplate(
	input,
	dependencies = defaultDependencies,
) {
	const {
		pool: databasePool,
		exercisesRepository: exercises,
		exerciseMusclesRepository: exerciseMuscles,
		exerciseVariantsRepository: exerciseVariants,
		translationMaintenanceRepository: translations,
	} = dependencies;
	const client = await databasePool.connect();

	try {
		await client.query("BEGIN");
		const variantExists = await exerciseVariants.update(input, client);
		if (!variantExists) throw new ExerciseTemplateNotFoundError();

		const exerciseExists = await exercises.update(input, client);
		if (!exerciseExists) throw new ExerciseTemplateNotFoundError();

		const exerciseTranslation = await translations.upsertTranslation(
			{
				entityType: "exercise",
				entityId: input.exerciseId,
				locale: "en",
				name: input.name,
			},
			client,
		);
		const variantTranslation = await translations.upsertTranslation(
			{
				entityType: "exercise_variant",
				entityId: input.variantId,
				locale: "en",
				name: input.name,
			},
			client,
		);
		if (!exerciseTranslation || !variantTranslation) {
			throw new Error("Exercise translations could not be synchronized");
		}

		await exerciseMuscles.deleteByExerciseId(input, client);
		for (const relation of input.muscleGroup) {
			await exerciseMuscles.create(
				{ exerciseId: input.exerciseId, ...relation },
				client,
			);
		}
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

export default updateExerciseTemplate;
