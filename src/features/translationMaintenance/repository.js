import pool from "../../../db/pool.js";
import { normalizeTranslationOverviewFilters } from "./translationMaintenanceContract.js";
import {
	findTranslationOverviewQuery,
	findTranslationRecordQuery,
	upsertTranslationQuery,
} from "./queries.js";

/**
 * @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient
 * @typedef {import("./translationMaintenanceContract.js").TranslationEntityType} TranslationEntityType
 */

/**
 * @param {{entityType?: unknown, search?: unknown}} [input]
 * @param {DatabaseClient} [db]
 */
export async function findOverviewRows(input = {}, db = pool) {
	const filters = normalizeTranslationOverviewFilters(input);
	const searchPattern = filters.search ? `%${filters.search}%` : null;
	const { rows } = await db.query(findTranslationOverviewQuery(), [
		filters.entityType,
		searchPattern,
	]);
	return rows;
}

/** @param {string} entityType @param {number} entityId @param {DatabaseClient} [db] */
export async function findEditableRecord(entityType, entityId, db = pool) {
	const { rows } = await db.query(findTranslationRecordQuery(entityType), [entityId]);
	return rows[0] ?? null;
}

/**
 * @param {{entityType: string, entityId: number, locale: string, name: string}} input
 * @param {DatabaseClient} [db]
 */
export async function upsertTranslation(
	{ entityType, entityId, locale, name },
	db = pool,
) {
	const { rows } = await db.query(upsertTranslationQuery(entityType), [
		entityId,
		locale,
		name,
	]);
	return rows[0] ?? null;
}
