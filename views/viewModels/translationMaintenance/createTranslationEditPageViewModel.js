import createViewModelTranslator from "../translate.js";

const localeDefinitions = [
	{
		locale: "en",
		key: "english",
		labelKey: "englishLabel",
		descriptionKey: "englishDescription",
	},
	{
		locale: "pt-BR",
		key: "portuguese",
		labelKey: "portugueseLabel",
		descriptionKey: "portugueseDescription",
	},
];

const entityTranslationKeys = Object.freeze({
	exercise: "exercise",
	exercise_variant: "exerciseVariant",
	muscle: "muscle",
	equipment: "equipment",
	movement_pattern: "movementPattern",
});

/** @param {Function} t @param {string} entityType */
function entityLabel(t, entityType) {
	const key = entityTranslationKeys[entityType] ?? "exercise";
	return t(`translationMaintenance.entities.${key}`, { defaultValue: entityType });
}

/**
 * @param {{page: object, currentUser: object | null, record: any, formState?: any, pageFeedback?: any, savedLocale?: string | null, translate?: Function}} input
 */
export default function createTranslationEditPageViewModel({
	page,
	currentUser,
	record,
	formState = null,
	pageFeedback = null,
	savedLocale = null,
	translate,
}) {
	const t = createViewModelTranslator(translate);
	const submittedValues = formState?.values ?? {};
	const submittedLocale = formState?.locale ?? null;
	const fieldErrors = formState?.errors?.fieldErrors ?? {};

	const localeForms = localeDefinitions.map(
		({ locale, key, labelKey, descriptionKey }) => {
			const isSubmittedLocale = submittedLocale === locale;
			const currentValue = record[`${key}Name`] ?? "";
			const preview = record.preview[key];
			return {
				locale,
				label: t(`translationMaintenance.${labelKey}`, {
					defaultValue: locale === "en" ? "English" : "Português (Brasil)",
				}),
				description: t(`translationMaintenance.${descriptionKey}`, {
					defaultValue:
						locale === "en"
							? "The reviewed English fallback used by the catalog."
							: "The reviewed Brazilian Portuguese catalog label.",
				}),
				value: isSubmittedLocale ? (submittedValues.name ?? "") : currentValue,
				error: isSubmittedLocale ? (fieldErrors.name ?? null) : null,
				preview: preview.value,
				previewLabel:
					currentValue === ""
						? t("translationMaintenance.fallbackPreview", {
								source:
									preview.source === "canonical"
										? t("translationMaintenance.canonicalFallback", {
												defaultValue: "canonical value",
											})
										: t("translationMaintenance.englishFallback", {
												defaultValue: "English translation",
											}),
								value: preview.value,
								defaultValue: "Users currently see {{value}} from the {{source}}.",
							})
						: null,
			};
		},
	);

	return {
		page,
		shell: { currentUser, activeNavigation: "admin-translations" },
		components: {
			pageFeedback,
			heading: {
				eyebrow: t("translationMaintenance.eyebrow", {
					defaultValue: "Administration",
				}),
				title: record.canonicalName,
				description: t("translationMaintenance.editDescription", {
					defaultValue:
						"Edit reviewed catalog translations without changing the canonical record or its relationships.",
				}),
				meta: entityLabel(t, record.entityType),
			},
			record: {
				entityType: record.entityType,
				entityLabel: entityLabel(t, record.entityType),
				canonicalName: record.canonicalName,
				id: record.id,
				status: record.status,
				statusLabel: t(
					`translationMaintenance.status.${record.status === "complete" ? "complete" : record.status === "missing-en" ? "missingEnglish" : record.status === "missing-pt-BR" ? "missingPortuguese" : "incomplete"}`,
					{ defaultValue: record.status },
				),
			},
			localeForms,
			backHref: "/admin/translations",
			savedMessage: savedLocale
				? t("translationMaintenance.savedMessage", {
						locale: savedLocale === "en" ? "English" : "Português (Brasil)",
						defaultValue: "{{locale}} translation saved.",
					})
				: null,
			formNote: t("translationMaintenance.formNote", {
				defaultValue:
					"Saving updates only the selected locale. Translation rows are upserted; they cannot be deleted here.",
			}),
		},
	};
}
