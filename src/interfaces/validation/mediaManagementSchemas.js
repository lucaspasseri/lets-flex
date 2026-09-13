import { z } from "zod";

const supportedEntityType = z.enum([
	"exercise",
	"exercise_variant",
	"muscle",
	"equipment",
	"movement_pattern",
]);

const optionalText = z.preprocess(
	(value) => (value === "" || value == null ? undefined : value),
	z.string().trim().optional(),
);

const positiveId = z.coerce.number().int().positive("Choose a valid catalog entity.");

export const mediaManagementQuerySchema = z.object({
	entity: optionalText.pipe(
		z
			.string()
			.regex(
				/^(exercise|exercise_variant|muscle|equipment|movement_pattern):[1-9]\d*$/,
				"Choose a supported catalog entity.",
			)
			.optional(),
	),
	entityType: optionalText.pipe(supportedEntityType.optional()),
	search: optionalText.pipe(
		z.string().max(100, "Catalog search is too long.").optional(),
	),
	saved: z.enum(["upload", "assign", "remove"]).optional(),
});

const altText = optionalText.pipe(
	z.string().max(500, "Image descriptions must be 500 characters or fewer.").optional(),
);

export const mediaUploadBodySchema = z.object({
	entityType: supportedEntityType,
	entityId: positiveId,
	altTextEn: altText,
	altTextPtBr: altText,
});

export const existingMediaBodySchema = z.object({
	entityType: supportedEntityType,
	entityId: positiveId,
	mediaAssetId: z.coerce.number().int().positive("Choose a valid media asset."),
	altTextEn: altText,
	altTextPtBr: altText,
});

export const removeMediaBodySchema = z.object({
	entityType: supportedEntityType,
	entityId: positiveId,
});
