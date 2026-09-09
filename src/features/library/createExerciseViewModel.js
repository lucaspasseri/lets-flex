import createMuscles from "./createMuscleViewModel.js";
import toCapitalizedString from "../../../utils/toCapitalizedString.js";

/**
 * @typedef {import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMapper} ExerciseTemplateMapper
 * @typedef {import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateItemViewModel} ExerciseTemplateItemViewModel
 */

/**
 * @typedef {object} CreateExerciseInput
 * @property {ExerciseTemplateMapper[]} exerciseTemplates
 * @property {number | null} actorUserId
 * @property {boolean} managementMode
 */

/**
 * @param {CreateExerciseInput} input
 * @returns {ExerciseTemplateItemViewModel}
 */
function createExercise({
	exerciseTemplates,
	actorUserId = null,
	managementMode = false,
}) {
	const exerciseTemplate = exerciseTemplates[0];
	if (!exerciseTemplate) {
		throw new TypeError("An exercise group requires at least one visible variant.");
	}

	const { id, movementPattern, muscles } = exerciseTemplate;
	const movementPatternLabel = movementPattern?.name
		? movementPattern.notes
			? `${movementPattern.name} - ${movementPattern.notes}`
			: movementPattern.name
		: "-";
	const muscleTemplates = createMuscles({ muscles });
	const variants = exerciseTemplates
		.map(({ equipment, variant }) => {
			const isPrivateOwner =
				actorUserId !== null && variant.ownerUserId === actorUserId;
			const equipmentLabel = equipment?.name ?? "Bodyweight";
			const environmentLabel = variant.environment
				? toCapitalizedString(variant.environment).replaceAll("_", " ")
				: "Not specified";
			const scopeLabel = isPrivateOwner ? "Private" : "Global";

			return {
				id: variant.id,
				name: variant.name,
				isPrivateOwner,
				equipment,
				environmentLabel,
				setupDescription: variant.setupDescription,
				notes: variant.notes,
				searchKeyWord: [
					variant.name,
					equipmentLabel,
					equipment?.category,
					environmentLabel,
					variant.setupDescription,
					variant.notes,
					scopeLabel,
				]
					.filter(Boolean)
					.join(" "),
				filters: {
					equipment: [equipmentLabel],
					environment: [environmentLabel],
					scope: [scopeLabel],
				},
				actions: {
					canManageGlobal: managementMode && variant.ownerUserId == null,
					canManagePrivate: isPrivateOwner,
					update: {
						label: `Edit ${variant.name}`,
						modalId: "updateExerciseModal",
						values: {
							exerciseId: id,
							variantId: variant.id,
							name: variant.name,
							movementPatternId: movementPattern?.id,
							equipmentId: equipment?.id,
							muscleGroup: muscles.map((muscle) => ({
								muscleId: muscle.id,
								muscleRoleId: muscle.role.id,
							})),
						},
					},
				},
			};
		})
		.sort((first, second) => first.name.localeCompare(second.name));
	const equipmentNames = [
		...new Set(variants.map((variant) => variant.equipment?.name ?? "Bodyweight")),
	];
	const variantCount = variants.length;
	const baseSearchKeyWord = [
		exerciseTemplate.name,
		movementPattern?.name,
		movementPattern?.notes,
		...muscles.flatMap((muscle) => [
			muscle.commonName,
			muscle.scientificName,
			muscle.bodyRegion,
		]),
	]
		.filter(Boolean)
		.join(" ");
	const searchKeyWord = [
		baseSearchKeyWord,
		...variants.map((variant) => variant.searchKeyWord),
	].join(" ");

	return {
		id,
		exerciseId: id,
		baseName: exerciseTemplate.name,
		searchKeyWord,
		baseSearchKeyWord,
		variantCount,
		filters: {
			movement: movementPattern?.name ? [movementPattern.name] : [],
			muscle: muscles.map((muscle) => muscle.commonName).filter(Boolean),
		},
		summary: {
			movementPatternLabel,
			equipmentSummary: equipmentNames.join(", ") || "Bodyweight",
			variantCountLabel: `${variantCount} ${variantCount === 1 ? "variant" : "variants"}`,
		},
		details: {
			movementPattern: {
				name: movementPatternLabel,
			},
			muscleTemplates,
			variants,
		},
		actions: {
			archive: managementMode
				? {
						label: `Archive ${exerciseTemplate.name}`,
						modalId: "deleteExerciseModal",
						value: id,
					}
				: null,
		},
	};
}

export default createExercise;
