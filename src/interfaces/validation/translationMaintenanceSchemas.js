import { z } from "zod";
import {
	getTranslationEntityDefinition,
	SUPPORTED_TRANSLATION_LOCALES,
	TRANSLATION_STATUS,
} from "../../features/translationMaintenance/translationMaintenanceContract.js";

const optionalText = z.preprocess(
	(value) => (value === "" || value == null ? undefined : value),
	z.string().trim().optional(),
);

export const translationOverviewQuerySchema = z.object({
	entityType: optionalText.refine(
		(value) => value === undefined || Boolean(getTranslationEntityDefinition(value)),
		"Choose a supported catalog entity.",
	),
	status: optionalText.refine(
		(value) =>
			value === undefined ||
			Object.values(TRANSLATION_STATUS).includes(/** @type {any} */ (value)),
		"Choose a supported translation status.",
	),
	search: optionalText.pipe(
		z.string().max(100, "Catalog search is too long.").optional(),
	),
});

export const translationMaintenanceParamsSchema = z.object({
	entityType: z
		.string()
		.refine(
			(value) => Boolean(getTranslationEntityDefinition(value)),
			"Choose a supported catalog entity.",
		),
	entityId: z.coerce.number().int().positive("Choose a valid catalog entity."),
});

export const translationMaintenanceBodySchema = z.object({
	locale: z.enum(
		/** @type {[string, ...string[]]} */ ([...SUPPORTED_TRANSLATION_LOCALES]),
		{
			error: "Choose a supported translation locale.",
		},
	),
	name: z
		.string()
		.trim()
		.min(1, "Enter a translation name.")
		.max(100, "Translation name must be 100 characters or fewer."),
});
