import {
	getTranslationEntityDefinition,
	getTranslationStatus,
	resolveTranslationPreview,
} from "./translationMaintenanceContract.js";

/**
 * @param {{entity_type: string, id: number, canonical_name: string, english_name?: string | null, portuguese_name?: string | null}} row
 */
export default function mapTranslationRecord(row) {
	const definition = getTranslationEntityDefinition(row.entity_type);
	if (!definition) {
		throw new Error("Translation maintenance returned an unsupported catalog entity.");
	}
	const translations = { en: row.english_name, "pt-BR": row.portuguese_name };
	return {
		entityType: definition.entityType,
		entityLabel: definition.label,
		id: row.id,
		canonicalName: row.canonical_name,
		englishName: row.english_name ?? null,
		portugueseName: row.portuguese_name ?? null,
		status: getTranslationStatus(translations),
		preview: {
			english: resolveTranslationPreview({
				locale: "en",
				translations,
				canonicalValue: row.canonical_name,
			}),
			portuguese: resolveTranslationPreview({
				locale: "pt-BR",
				translations,
				canonicalValue: row.canonical_name,
			}),
		},
	};
}
