import pool from "../../../db/pool.js";
import { normalizeCatalogLocale } from "../catalogLocalization/catalogLocalization.js";
import * as queries from "./queries.js";

export async function findAllForUser({ userId, locale }, db = pool) {
	const { rows } = await db.query(queries.findAllQuery(), [
		userId,
		normalizeCatalogLocale(locale),
	]);
	return rows;
}

export async function find({ exerciseId, locale }, db = pool) {
	const { rows } = await db.query(queries.findByIdQuery(), [
		exerciseId,
		normalizeCatalogLocale(locale),
	]);
	return rows[0] ?? null;
}
