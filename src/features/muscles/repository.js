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
			muscles.id,
			${localizedCatalogValueSql({ alias: "muscle_translation", canonicalExpression: "muscles.common_name" })} AS common_name,
			${localizedCatalogLocaleSql({ alias: "muscle_translation" })} AS common_name_locale,
			muscles.scientific_name,
			muscles.body_region,
			muscles.reference_url
		 FROM muscles
		 ${localizedCatalogJoinSql({
				translationTable: "muscle_translations",
				translationEntityColumn: "muscle_id",
				entityIdExpression: "muscles.id",
				alias: "muscle_translation",
				localeParameter: "$1",
			})}`,
		[normalizedLocale],
	);
	return rows;
}
