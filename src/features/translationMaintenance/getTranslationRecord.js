import * as translationMaintenanceRepository from "./repository.js";
import mapTranslationRecord from "./mapTranslationRecord.js";
import {
	TranslationMaintenanceValidationError,
	getTranslationEntityDefinition,
} from "./translationMaintenanceContract.js";

/**
 * @param {{entityType: string, entityId: number}} input
 * @param {import("pg").Pool | import("pg").PoolClient} [db]
 */
export default async function getTranslationRecord({ entityType, entityId }, db) {
	if (!getTranslationEntityDefinition(entityType)) {
		throw new TranslationMaintenanceValidationError(
			"unsupported_entity_type",
			"Choose a supported catalog entity.",
		);
	}
	const row = await translationMaintenanceRepository.findEditableRecord(
		entityType,
		entityId,
		db,
	);
	return row ? mapTranslationRecord({ ...row, entity_type: entityType }) : null;
}
