import * as translationMaintenanceRepository from "./repository.js";
import {
	TranslationMaintenanceValidationError,
	validateTranslationInput,
} from "./translationMaintenanceContract.js";

export class TranslationMaintenanceNotFoundError extends Error {
	constructor() {
		super("Translation catalog record was not found.");
		this.name = "TranslationMaintenanceNotFoundError";
	}
}

/**
 * @param {{entityType: unknown, entityId: unknown, locale: unknown, name: unknown}} input
 * @param {import("pg").Pool | import("pg").PoolClient} [db]
 */
export default async function updateTranslation(input, db) {
	if (typeof input.entityId !== "number") {
		throw new TranslationMaintenanceValidationError(
			"invalid_entity_id",
			"Choose a valid catalog entity.",
		);
	}
	const validated = validateTranslationInput({
		entityType: input.entityType,
		entityId: input.entityId,
		locale: input.locale,
		name: input.name,
	});
	const row = await translationMaintenanceRepository.upsertTranslation(validated, db);
	if (!row) throw new TranslationMaintenanceNotFoundError();
	return row;
}
