import {
	normalizeCatalogLocale,
	SUPPORTED_CATALOG_LOCALES,
} from "../catalogLocalization/catalogLocalization.js";

/**
 * @typedef {"exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern"} TranslationEntityType
 * @typedef {"en" | "pt-BR"} TranslationLocale
 * @typedef {"complete" | "missing-en" | "missing-pt-BR" | "incomplete"} TranslationStatus
 */

export const TRANSLATION_LOCALES = Object.freeze({
	ENGLISH: "en",
	PORTUGUESE: "pt-BR",
});

/** @type {Readonly<Record<string, TranslationStatus>>} */
export const TRANSLATION_STATUS = Object.freeze({
	COMPLETE: "complete",
	MISSING_ENGLISH: "missing-en",
	MISSING_PORTUGUESE: "missing-pt-BR",
	INCOMPLETE: "incomplete",
});

export const TRANSLATION_PREVIEW_SOURCE = Object.freeze({
	ACTIVE_LOCALE: "active-locale",
	ENGLISH: "english",
	ENGLISH_FALLBACK: "english-fallback",
	CANONICAL: "canonical",
});

/**
 * The maintenance contract deliberately exposes names only. Existing localized description
 * columns are not consumed by the current catalog presentation paths, so exposing them here would
 * create edits that users cannot reliably see. A later action may extend a specific entity after
 * its read path is integrated.
 *
 * @typedef {object} TranslationEntityDefinition
 * @property {TranslationEntityType} entityType
 * @property {string} label
 * @property {string} translationTable
 * @property {string} entityIdColumn
 * @property {string} sourceTable
 * @property {string} canonicalNameColumn
 * @property {boolean} globalOnly
 * @property {ReadonlyArray<{key: "name", label: string, required: boolean}>} fields
 */

/** @type {ReadonlyArray<{key: "name", label: string, required: boolean}>} */
const nameFields = Object.freeze([{ key: "name", label: "Name", required: true }]);

/** @type {Readonly<Record<string, TranslationEntityDefinition>>} */
export const translationEntityDefinitions = Object.freeze({
	exercise: Object.freeze({
		entityType: "exercise",
		label: "Exercises",
		translationTable: "exercise_translations",
		entityIdColumn: "exercise_id",
		sourceTable: "exercises",
		canonicalNameColumn: "name",
		globalOnly: true,
		fields: nameFields,
	}),
	exercise_variant: Object.freeze({
		entityType: "exercise_variant",
		label: "Global exercise variants",
		translationTable: "exercise_variant_translations",
		entityIdColumn: "exercise_variant_id",
		sourceTable: "exercise_variants",
		canonicalNameColumn: "name",
		globalOnly: true,
		fields: nameFields,
	}),
	muscle: Object.freeze({
		entityType: "muscle",
		label: "Muscles",
		translationTable: "muscle_translations",
		entityIdColumn: "muscle_id",
		sourceTable: "muscles",
		canonicalNameColumn: "common_name",
		globalOnly: true,
		fields: nameFields,
	}),
	equipment: Object.freeze({
		entityType: "equipment",
		label: "Equipment",
		translationTable: "equipment_translations",
		entityIdColumn: "equipment_id",
		sourceTable: "equipments",
		canonicalNameColumn: "name",
		globalOnly: true,
		fields: nameFields,
	}),
	movement_pattern: Object.freeze({
		entityType: "movement_pattern",
		label: "Movement patterns",
		translationTable: "movement_pattern_translations",
		entityIdColumn: "movement_pattern_id",
		sourceTable: "movement_patterns",
		canonicalNameColumn: "name",
		globalOnly: true,
		fields: nameFields,
	}),
});

export const SUPPORTED_TRANSLATION_LOCALES = SUPPORTED_CATALOG_LOCALES;
export const REQUIRED_TRANSLATION_LOCALES = SUPPORTED_TRANSLATION_LOCALES;

export const TRANSLATION_MUTATION_POLICY = Object.freeze({
	operation: "upsert",
	allowDelete: false,
	englishFallback: "canonical-when-english-row-is-absent",
});

const translationStatusValues = new Set(Object.values(TRANSLATION_STATUS));

/**
 * @param {{entityType?: unknown, status?: unknown, search?: unknown}} [input]
 * @returns {{entityType: TranslationEntityType | null, status: TranslationStatus | null, search: string | null}}
 */
export function normalizeTranslationOverviewFilters(input = {}) {
	const entityType =
		input.entityType == null || input.entityType === "" ? null : input.entityType;
	if (entityType !== null && !getTranslationEntityDefinition(entityType)) {
		throw new TranslationMaintenanceValidationError(
			"unsupported_entity_type",
			"Choose a supported catalog entity.",
		);
	}

	const status = input.status == null || input.status === "" ? null : input.status;
	if (
		status !== null &&
		!translationStatusValues.has(/** @type {TranslationStatus} */ (status))
	) {
		throw new TranslationMaintenanceValidationError(
			"unsupported_status",
			"Choose a supported translation status.",
		);
	}

	if (input.search != null && typeof input.search !== "string") {
		throw new TranslationMaintenanceValidationError(
			"invalid_search",
			"Enter a valid catalog search.",
		);
	}
	const search = typeof input.search === "string" ? input.search.trim() : "";
	if (search.length > 100) {
		throw new TranslationMaintenanceValidationError(
			"search_too_long",
			"Catalog search must be 100 characters or fewer.",
		);
	}

	return {
		entityType: /** @type {TranslationEntityType | null} */ (entityType),
		status: /** @type {TranslationStatus | null} */ (status),
		search: search || null,
	};
}

/**
 * @param {unknown} entityType
 * @returns {TranslationEntityDefinition | null}
 */
export function getTranslationEntityDefinition(entityType) {
	if (typeof entityType !== "string") {
		return null;
	}
	return translationEntityDefinitions[entityType] ?? null;
}

/** @returns {TranslationEntityType[]} */
export function getTranslationEntityTypes() {
	return /** @type {TranslationEntityType[]} */ (
		Object.keys(translationEntityDefinitions)
	);
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function hasTranslationValue(value) {
	return typeof value === "string" && value.trim() !== "";
}

/**
 * Completeness describes persisted translation availability, not whether canonical fallback text
 * exists. This keeps missing English visible even when the legacy canonical column is usable.
 *
 * @param {{en?: unknown, "pt-BR"?: unknown}} [translations]
 * @returns {TranslationStatus}
 */
export function getTranslationStatus(translations = {}) {
	const hasEnglish = hasTranslationValue(translations.en);
	const hasPortuguese = hasTranslationValue(
		translations[TRANSLATION_LOCALES.PORTUGUESE],
	);

	if (hasEnglish && hasPortuguese) {
		return TRANSLATION_STATUS.COMPLETE;
	}
	if (!hasEnglish && hasPortuguese) {
		return TRANSLATION_STATUS.MISSING_ENGLISH;
	}
	if (hasEnglish && !hasPortuguese) {
		return TRANSLATION_STATUS.MISSING_PORTUGUESE;
	}
	return TRANSLATION_STATUS.INCOMPLETE;
}

export class TranslationMaintenanceValidationError extends Error {
	/** @param {string} code @param {string} message */
	constructor(code, message) {
		super(message);
		this.name = "TranslationMaintenanceValidationError";
		this.code = code;
	}
}

/**
 * Validate and normalize the small upsert contract used by later repository actions.
 *
 * @param {{entityType: unknown, entityId: unknown, locale: unknown, name: unknown}} input
 * @returns {{entityType: TranslationEntityType, entityId: number, locale: TranslationLocale, name: string}}
 */
export function validateTranslationInput({ entityType, entityId, locale, name }) {
	const definition = getTranslationEntityDefinition(entityType);
	if (!definition) {
		throw new TranslationMaintenanceValidationError(
			"unsupported_entity_type",
			"Choose a supported catalog entity.",
		);
	}
	if (typeof entityId !== "number" || !Number.isInteger(entityId) || entityId <= 0) {
		throw new TranslationMaintenanceValidationError(
			"invalid_entity_id",
			"Choose a valid catalog entity.",
		);
	}
	if (
		!SUPPORTED_TRANSLATION_LOCALES.includes(/** @type {TranslationLocale} */ (locale))
	) {
		throw new TranslationMaintenanceValidationError(
			"unsupported_locale",
			"Choose a supported translation locale.",
		);
	}
	if (typeof name !== "string" || name.trim() === "") {
		throw new TranslationMaintenanceValidationError(
			"required_name",
			"Enter a translation name.",
		);
	}

	return {
		entityType: definition.entityType,
		entityId,
		locale: /** @type {TranslationLocale} */ (locale),
		name: name.trim(),
	};
}

/**
 * Resolve the same preview order used by catalog reads. No translation is deleted by this
 * contract, and canonical fallback remains visible when an English row is absent.
 *
 * @param {{locale?: unknown, translations?: {en?: unknown, "pt-BR"?: unknown}, canonicalValue?: unknown}} input
 * @returns {{value: string, source: string, locale: TranslationLocale | "canonical"}}
 */
export function resolveTranslationPreview({
	locale,
	translations = {},
	canonicalValue = "",
}) {
	const activeLocale = normalizeCatalogLocale(locale);
	const activeValue = translations[activeLocale];
	if (hasTranslationValue(activeValue)) {
		return {
			value: /** @type {string} */ (activeValue).trim(),
			source:
				activeLocale === TRANSLATION_LOCALES.ENGLISH
					? TRANSLATION_PREVIEW_SOURCE.ENGLISH
					: TRANSLATION_PREVIEW_SOURCE.ACTIVE_LOCALE,
			locale: activeLocale,
		};
	}

	const englishValue = translations[TRANSLATION_LOCALES.ENGLISH];
	if (hasTranslationValue(englishValue)) {
		return {
			value: /** @type {string} */ (englishValue).trim(),
			source: TRANSLATION_PREVIEW_SOURCE.ENGLISH_FALLBACK,
			locale: TRANSLATION_LOCALES.ENGLISH,
		};
	}

	return {
		value: typeof canonicalValue === "string" ? canonicalValue.trim() : "",
		source: TRANSLATION_PREVIEW_SOURCE.CANONICAL,
		locale: "canonical",
	};
}
