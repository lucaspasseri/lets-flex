import pool from "../../../db/pool.js";
import {
	localizedCatalogJoinSql,
	localizedCatalogLocaleSql,
	localizedCatalogValueSql,
	normalizeCatalogLocale,
} from "../catalogLocalization/catalogLocalization.js";

/** @param {{locale?: string}} [input] @param {any} [db] */
export async function findAll({ locale } = {}, db = pool) {
	const normalizedLocale = normalizeCatalogLocale(locale);
	const { rows } = await db.query(
		`SELECT
			movement_patterns.id,
			${localizedCatalogValueSql({ alias: "movement_pattern_translation", canonicalExpression: "movement_patterns.name" })} AS name,
			${localizedCatalogLocaleSql({ alias: "movement_pattern_translation" })} AS name_locale,
			movement_patterns.notes
		 FROM movement_patterns
		 ${localizedCatalogJoinSql({
				translationTable: "movement_pattern_translations",
				translationEntityColumn: "movement_pattern_id",
				entityIdExpression: "movement_patterns.id",
				alias: "movement_pattern_translation",
				localeParameter: "$1",
			})}`,
		[normalizedLocale],
	);
	return rows;
}
