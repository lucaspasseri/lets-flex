import pool from "../../../db/pool.js";
import * as exercisesRepository from "../exercises/repository.js";
import * as exerciseMusclesRepository from "../exerciseMuscles/repository.js";
import * as exerciseVariantsRepository from "../exerciseVariants/repository.js";
import * as translationMaintenanceRepository from "../translationMaintenance/repository.js";

const defaultDependencies = {
	pool,
	exercisesRepository,
	exerciseMusclesRepository,
	exerciseVariantsRepository,
	translationMaintenanceRepository,
};

/**
 * @param {{name: string, movementPatternId: number, equipmentId: number | null, muscleGroup: Array<{muscleId: number, muscleRoleId: number}>, createdByUserId: number}} input
 * @param {any} dependencies
 */
export async function createExerciseTemplate(
	{ name, movementPatternId, equipmentId, muscleGroup, createdByUserId },
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

		const exercise = await exercises.create(
			{ name, movementPatternId, createdByUserId },
			client,
		);
		if (!exercise) {
			throw new Error("Exercise could not be created");
		}

		for (const { muscleId, muscleRoleId } of muscleGroup) {
			await exerciseMuscles.create(
				{ exerciseId: exercise.id, muscleId, muscleRoleId },
				client,
			);
		}

		const variant = await exerciseVariants.create(
			{ name, exerciseId: exercise.id, equipmentId },
			client,
		);
		if (!variant) throw new Error("Exercise variant could not be created");

		const exerciseTranslation = await translations.upsertTranslation(
			{ entityType: "exercise", entityId: exercise.id, locale: "en", name },
			client,
		);
		const variantTranslation = await translations.upsertTranslation(
			{
				entityType: "exercise_variant",
				entityId: variant.id,
				locale: "en",
				name,
			},
			client,
		);
		if (!exerciseTranslation || !variantTranslation) {
			throw new Error("Exercise translations could not be created");
		}

		await client.query("COMMIT");
		return { exercise, variant };
	} catch (err) {
		await client.query("ROLLBACK");
		throw new Error("Failed to create exercise template", { cause: err });
	} finally {
		client.release();
	}
}

export default createExerciseTemplate;
