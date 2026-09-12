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
			equipments.id,
			${localizedCatalogValueSql({ alias: "equipment_translation", canonicalExpression: "equipments.name" })} AS name,
			${localizedCatalogLocaleSql({ alias: "equipment_translation" })} AS name_locale,
			equipments.category
		 FROM equipments
		 ${localizedCatalogJoinSql({
				translationTable: "equipment_translations",
				translationEntityColumn: "equipment_id",
				entityIdExpression: "equipments.id",
				alias: "equipment_translation",
				localeParameter: "$1",
			})}`,
		[normalizedLocale],
	);
	return rows;
}
