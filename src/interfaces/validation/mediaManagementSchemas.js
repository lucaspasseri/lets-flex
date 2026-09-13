import { z } from "zod";
import {
	MEDIA_GENERATION_ENTITY_TYPES,
	MEDIA_GENERATION_UNSUPPORTED_ENTITY_MESSAGE,
} from "../../features/media/mediaGenerationPolicy.js";

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
const candidateId = z.coerce
	.number()
	.int()
	.positive("Choose a valid generated media candidate.");
const generatableEntityType = z.enum(
	/** @type {[string, ...string[]]} */ (MEDIA_GENERATION_ENTITY_TYPES),
	MEDIA_GENERATION_UNSUPPORTED_ENTITY_MESSAGE,
);

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
	saved: z
		.enum(["upload", "assign", "remove", "generate", "reject", "approve"])
		.optional(),
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

export const generateMediaBodySchema = z.object({
	entityType: generatableEntityType,
	entityId: positiveId,
	requestNonce: z.string().uuid("Refresh the page and try again."),
	refinement: optionalText.pipe(
		z
			.string()
			.max(280, "Visual refinement must be 280 characters or fewer.")
			.refine(
				(value) =>
					[...value].every((character) => {
						const codePoint = character.codePointAt(0) ?? 0;
						return codePoint >= 32 && codePoint !== 127;
					}),
				"Visual refinement cannot contain control characters.",
			)
			.optional(),
	),
});

export const regenerateMediaBodySchema = generateMediaBodySchema.extend({
	candidateId,
});

export const mediaGenerationCandidateParamsSchema = z.object({ candidateId });

export const rejectMediaGenerationCandidateBodySchema = z.object({
	entityType: generatableEntityType,
	entityId: positiveId,
});

export const approveMediaGenerationCandidateBodySchema = z.object({
	entityType: generatableEntityType,
	entityId: positiveId,
	altTextEn: z
		.string()
		.trim()
		.min(1, "Enter a meaningful English image description.")
		.max(500, "Image descriptions must be 500 characters or fewer."),
	altTextPtBr: z
		.string()
		.trim()
		.min(1, "Enter a meaningful Brazilian Portuguese image description.")
		.max(500, "Image descriptions must be 500 characters or fewer."),
});
