/** @typedef {"en" | "pt-BR"} CatalogLocale */
/** @typedef {CatalogLocale | "canonical"} ResolvedCatalogLocale */

export const DEFAULT_CATALOG_LOCALE = "en";
export const SUPPORTED_CATALOG_LOCALES = Object.freeze(["en", "pt-BR"]);

/**
 * Keep database-backed catalog reads on the same two-locale contract as the
 * request i18n layer. Unknown values use English rather than entering SQL.
 *
 * @param {unknown} value
 * @returns {CatalogLocale}
 */
export function normalizeCatalogLocale(value) {
	return SUPPORTED_CATALOG_LOCALES.includes(/** @type {CatalogLocale} */ (value))
		? /** @type {CatalogLocale} */ (value)
		: DEFAULT_CATALOG_LOCALE;
}

/**
 * Produces a bounded, indexed lateral lookup for one catalog translation.
 * The table and column values are application-owned SQL fragments, never
 * request input. The primary key `(entity_id, locale)` supports the lookup. Any
 * additional condition is also application-owned SQL, such as excluding private
 * variants from the global translation table.
 *
 * @param {{translationTable: string, translationEntityColumn: string, entityIdExpression: string, alias: string, localeParameter: string, additionalCondition?: string}} input
 * @returns {string}
 */
export function localizedCatalogJoinSql({
	translationTable,
	translationEntityColumn,
	entityIdExpression,
	alias,
	localeParameter,
	additionalCondition = "",
}) {
	return `LEFT JOIN LATERAL (
		SELECT name, locale
		FROM ${translationTable}
		WHERE ${translationEntityColumn} = ${entityIdExpression}
			${additionalCondition ? `AND ${additionalCondition}` : ""}
			AND locale IN (${localeParameter}, 'en')
		ORDER BY CASE WHEN locale = ${localeParameter} THEN 0 ELSE 1 END
		LIMIT 1
	) AS ${alias} ON TRUE`;
}

/** @param {{alias: string, canonicalExpression: string}} input @returns {string} */
export function localizedCatalogValueSql({ alias, canonicalExpression }) {
	return `COALESCE(${alias}.name, ${canonicalExpression})`;
}

/** @param {{alias: string}} input @returns {string} */
export function localizedCatalogLocaleSql({ alias }) {
	return `COALESCE(${alias}.locale, 'canonical')`;
}
