import pool from "../../../db/pool.js";
import * as exerciseVariantsRepository from "../exerciseVariants/repository.js";
import * as translationMaintenanceRepository from "../translationMaintenance/repository.js";

const defaultDependencies = {
	pool,
	exerciseVariantsRepository,
	translationMaintenanceRepository,
};

/**
 * @param {{name: string, exerciseId: number, equipmentId: number | null}} input
 * @param {any} dependencies
 * @returns {Promise<any | null>}
 */
export async function createGlobalVariant(input, dependencies = defaultDependencies) {
	const {
		pool: databasePool,
		exerciseVariantsRepository: exerciseVariants,
		translationMaintenanceRepository: translations,
	} = dependencies;
	const client = await databasePool.connect();

	try {
		await client.query("BEGIN");
		const variant = await exerciseVariants.createGlobal(input, client);
		if (!variant) {
			await client.query("COMMIT");
			return null;
		}

		const translation = await translations.upsertTranslation(
			{
				entityType: "exercise_variant",
				entityId: variant.id,
				locale: "en",
				name: input.name,
			},
			client,
		);
		if (!translation)
			throw new Error("Exercise variant translation could not be created");

		await client.query("COMMIT");
		return variant;
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

export default createGlobalVariant;
