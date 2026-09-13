export const MEDIA_GENERATION_ENTITY_TYPES = Object.freeze([
	"exercise",
	"exercise_variant",
	"equipment",
	"movement_pattern",
]);

export const MEDIA_GENERATION_PRESETS = Object.freeze({
	exercise: "exercise-editorial",
	exercise_variant: "exercise-editorial",
	equipment: "equipment-editorial",
	movement_pattern: "movement-pattern-graphic",
});

export const MEDIA_GENERATION_UNSUPPORTED_ENTITY_MESSAGE =
	"AI generation supports exercises, global variants, equipment, and movement patterns.";

/** @param {unknown} entityType */
export function supportsMediaGenerationEntity(entityType) {
	return (
		typeof entityType === "string" &&
		Object.hasOwn(MEDIA_GENERATION_PRESETS, entityType)
	);
}
