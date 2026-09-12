import createViewModelTranslator from "../translate.js";
import {
	getTranslationEntityTypes,
	TRANSLATION_STATUS,
} from "../../../src/features/translationMaintenance/translationMaintenanceContract.js";

const entityTranslationKeys = Object.freeze({
	exercise: "exercise",
	exercise_variant: "exerciseVariant",
	muscle: "muscle",
	equipment: "equipment",
	movement_pattern: "movementPattern",
});

/**
 * @param {Function} t
 * @param {string} entityType
 */
function entityLabel(t, entityType) {
	const key = entityTranslationKeys[entityType] ?? "exercise";
	return t(`translationMaintenance.entities.${key}`, {
		defaultValue: entityType,
	});
}

/**
 * @param {Function} t
 * @param {string} status
 */
function statusLabel(t, status) {
	const key = {
		[TRANSLATION_STATUS.COMPLETE]: "complete",
		[TRANSLATION_STATUS.MISSING_ENGLISH]: "missingEnglish",
		[TRANSLATION_STATUS.MISSING_PORTUGUESE]: "missingPortuguese",
		[TRANSLATION_STATUS.INCOMPLETE]: "incomplete",
	}[status];
	return t(`translationMaintenance.status.${key ?? "incomplete"}`, {
		defaultValue: status,
	});
}

/**
 * @param {{page: object, currentUser: object | null, overview: any, translate?: Function}} input
 */
export default function createTranslationMaintenancePageViewModel({
	page,
	currentUser,
	overview,
	translate,
}) {
	const t = createViewModelTranslator(translate);
	const statusCards = [
		[TRANSLATION_STATUS.COMPLETE, "complete"],
		[TRANSLATION_STATUS.MISSING_PORTUGUESE, "missingPortuguese"],
		[TRANSLATION_STATUS.MISSING_ENGLISH, "missingEnglish"],
		[TRANSLATION_STATUS.INCOMPLETE, "incomplete"],
	].map(([status, key]) => ({
		status,
		label: t(`translationMaintenance.status.${key}`, { defaultValue: status }),
		count: overview.summary.statusCounts[status] ?? 0,
	}));

	const records = overview.records.map((record) => ({
		...record,
		editHref: `/admin/translations/${encodeURIComponent(record.entityType)}/${record.id}`,
		entityLabel: entityLabel(t, record.entityType),
		statusLabel: statusLabel(t, record.status),
		english: {
			value:
				record.englishName ??
				t("translationMaintenance.missing", { defaultValue: "Missing" }),
			isMissing: record.englishName == null,
			fallbackLabel:
				record.englishName == null
					? t("translationMaintenance.fallbackShown", {
							value: record.preview.english.value,
							defaultValue: "Fallback shown: {{value}}",
						})
					: null,
		},
		portuguese: {
			value:
				record.portugueseName ??
				t("translationMaintenance.missing", { defaultValue: "Missing" }),
			isMissing: record.portugueseName == null,
			fallbackLabel:
				record.portugueseName == null
					? t("translationMaintenance.fallbackShown", {
							value: record.preview.portuguese.value,
							defaultValue: "Fallback shown: {{value}}",
						})
					: null,
		},
	}));

	return {
		page,
		shell: { currentUser, activeNavigation: "admin-translations" },
		translationMaintenance: {
			heading: {
				eyebrow: t("translationMaintenance.eyebrow", {
					defaultValue: "Administration",
				}),
				title: t("translationMaintenance.title", {
					defaultValue: "Translation maintenance",
				}),
				description: t("translationMaintenance.description", {
					defaultValue:
						"Review application-managed catalog coverage and identify the translations that need attention.",
				}),
				meta: t("translationMaintenance.adminOnly", { defaultValue: "Admin only" }),
			},
			scopeDescription: t("translationMaintenance.scopeDescription", {
				defaultValue:
					"Only global catalog records appear here. Personal content and private exercise variants remain outside translation maintenance.",
			}),
			statusCards,
			filters: {
				...overview.filters,
				entityOptions: [
					{
						value: "",
						label: t("translationMaintenance.allEntities", {
							defaultValue: "All catalog types",
						}),
					},
					...getTranslationEntityTypes().map((entityType) => ({
						value: entityType,
						label: entityLabel(t, entityType),
					})),
				],
				statusOptions: [
					{
						value: "",
						label: t("translationMaintenance.allStatuses", {
							defaultValue: "All statuses",
						}),
					},
					...statusCards.map(({ status, label }) => ({ value: status, label })),
				],
			},
			records,
			resultLabel: t("translationMaintenance.resultCount", {
				count: records.length,
				defaultValue: "{{count}} catalog records",
			}),
			noResults: records.length === 0,
		},
	};
}
