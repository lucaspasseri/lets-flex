import * as translationMaintenanceRepository from "./repository.js";
import mapTranslationRecord from "./mapTranslationRecord.js";
import {
	getTranslationEntityTypes,
	normalizeTranslationOverviewFilters,
	TRANSLATION_STATUS,
} from "./translationMaintenanceContract.js";

/**
 * @typedef {import("./translationMaintenanceContract.js").TranslationStatus} TranslationStatus
 * @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient
 */

/**
 * @param {{entityType?: unknown, status?: unknown, search?: unknown}} [input]
 * @param {DatabaseClient} [db]
 */
export default async function getTranslationOverview(input = {}, db) {
	const filters = normalizeTranslationOverviewFilters(input);
	const rows = await translationMaintenanceRepository.findOverviewRows(filters, db);
	const allRecords = rows.map(mapTranslationRecord);
	const records = filters.status
		? allRecords.filter((record) => record.status === filters.status)
		: allRecords;

	const statusCounts = Object.fromEntries(
		Object.values(TRANSLATION_STATUS).map((status) => [status, 0]),
	);
	const entityCounts = Object.fromEntries(
		getTranslationEntityTypes().map((entityType) => [
			entityType,
			{ total: 0, statusCounts: { ...statusCounts } },
		]),
	);

	for (const record of records) {
		statusCounts[record.status] += 1;
		entityCounts[record.entityType].total += 1;
		entityCounts[record.entityType].statusCounts[record.status] += 1;
	}

	return {
		filters,
		records,
		summary: {
			total: records.length,
			statusCounts,
			entityCounts,
		},
	};
}
