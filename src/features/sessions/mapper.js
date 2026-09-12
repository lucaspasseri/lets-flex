import toCapitalizedString from "../../../utils/toCapitalizedString.js";
import { toMuscle } from "../muscles/mapper.js";

/**
 * @typedef {import("./sessions.types.js").SessionRow} SessionRow
 * @typedef {import("./sessions.types.js").SessionQueryStepRow} SessionQueryStepRow
 * @typedef {import("./sessions.types.js").SessionMapperStep} SessionMapperStep
 * @typedef {import("./sessions.types.js").SessionMapper} SessionMapper
 */

/**
 * @param {SessionRow} session
 * @returns {SessionMapper}
 */

export function toSessionMapperSeed(session) {
	return {
		id: session.id,
		name: session.name,
		notes: session.notes,
		isArchived: session.is_archived,
		ownerUserId: session.owner_user_id ?? null,
		steps: (session.steps ?? []).map(toSessionMapperStepSeed),
	};
}

/**
 * @param {SessionQueryStepRow} step
 * @returns { SessionMapperStep}
 */

export function toSessionMapperStepSeed(step) {
	return {
		id: step.id,
		name: step.name,
		order: step.step_order,
		stepTypeId: step.step_type_id,
		exerciseVariantId: step.exercise_variant_id,
		type: toCapitalizedString(step.step_type_name).replace("_", " "),
		sets: step.sets,
		reps: step.reps,
		loadValue: step.load_value,
		loadUnit: step.load_unit,
		movementPattern: toCapitalizedString(step.movement_pattern_name),
		movementPatternLocale: step.movement_pattern_name_locale ?? "canonical",
		canonicalMovementPattern: toCapitalizedString(
			step.canonical_movement_pattern_name ?? step.movement_pattern_name,
		),
		exercise: {
			name: step.exercise_name,
			nameLocale: step.exercise_name_locale ?? "canonical",
			canonicalName: step.canonical_exercise_name ?? step.exercise_name,
			variantName: step.exercise_variant_name,
			variantNameLocale: step.exercise_variant_name_locale ?? "canonical",
			canonicalVariantName:
				step.canonical_exercise_variant_name ?? step.exercise_variant_name,
			setupDescription: step.exercise_variant_setup_description,
			environment: step.exercise_variant_environment,
			notes: step.exercise_variant_notes,
		},
		equipment: {
			name: step.equipment_name,
			nameLocale: step.equipment_name_locale ?? "canonical",
			canonicalName: step.canonical_equipment_name ?? step.equipment_name,
			category: toCapitalizedString(step.equipment_category).replaceAll("_", " "),
		},
		muscles: (step.muscles ?? []).map(toMuscle),
	};
}
