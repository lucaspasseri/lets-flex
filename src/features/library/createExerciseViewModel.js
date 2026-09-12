import createMuscles from "./createMuscleViewModel.js";
import toCapitalizedString from "../../../utils/toCapitalizedString.js";
import { resolveMedia } from "../media/resolveMedia.js";

/**
 * @typedef {import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMapper} ExerciseTemplateMapper
 * @typedef {import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateItemViewModel} ExerciseTemplateItemViewModel
 */

/**
 * @typedef {object} CreateExerciseInput
 * @property {ExerciseTemplateMapper[]} exerciseTemplates
 * @property {number | null} actorUserId
 * @property {boolean} managementMode
 * @property {Record<string, any>} [privateVariantMutationState]
 */

/**
 * @param {CreateExerciseInput} input
 * @returns {ExerciseTemplateItemViewModel}
 */
function createExercise({
	exerciseTemplates,
	actorUserId = null,
	managementMode = false,
	privateVariantMutationState,
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
	const firstVariant = exerciseTemplates[0]?.variant;
	const baseMedia = resolveMedia({
		entityType: "exercise",
		baseName: exerciseTemplate.name,
		movementPattern: movementPattern?.name,
		matchBaseName: exerciseTemplate.canonicalName,
		matchMovementPattern: movementPattern?.canonicalName,
		environment: firstVariant?.environment,
		label: exerciseTemplate.name,
		presentation: "initial",
	});
	const variants = exerciseTemplates
		.map(({ equipment, variant }) => {
			const isPrivateOwner =
				actorUserId !== null && variant.ownerUserId === actorUserId;
			const isMutationTarget =
				isPrivateOwner &&
				String(privateVariantMutationState?.variantId) === String(variant.id);
			const mutationValues = isMutationTarget
				? (privateVariantMutationState?.values ?? {})
				: {};
			const mutationName =
				typeof mutationValues.name === "string" ? mutationValues.name : variant.name;
			const mutationEquipmentId = Object.hasOwn(mutationValues, "equipmentId")
				? mutationValues.equipmentId
				: equipment?.id;
			const equipmentLabel = equipment?.name ?? "Bodyweight";
			const environmentLabel = variant.environment
				? toCapitalizedString(variant.environment).replaceAll("_", " ")
				: "Not specified";
			const scopeLabel = isPrivateOwner ? "Private" : "Global";
			const equipmentSearchLabels = [
				equipmentLabel,
				equipment?.canonicalName,
				equipment?.category,
			];
			const media = resolveMedia({
				entityType: "exercise",
				variantName: variant.name,
				baseName: exerciseTemplate.name,
				movementPattern: movementPattern?.name,
				matchVariantName: variant.canonicalName,
				matchBaseName: exerciseTemplate.canonicalName,
				matchMovementPattern: movementPattern?.canonicalName,
				environment: variant.environment,
				label: variant.name,
				presentation: "initial",
			});

			return {
				id: variant.id,
				name: variant.name,
				media,
				isPrivateOwner,
				equipment,
				environmentLabel,
				setupDescription: variant.setupDescription,
				notes: variant.notes,
				searchKeyWord: [
					variant.name,
					variant.canonicalName,
					...equipmentSearchLabels,
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
				privateMutation: isMutationTarget
					? {
							name: mutationName,
							equipmentId: mutationEquipmentId,
							error: privateVariantMutationState?.error ?? null,
						}
					: null,
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
		exerciseTemplate.canonicalName,
		movementPattern?.name,
		movementPattern?.canonicalName,
		movementPattern?.notes,
		...muscles.flatMap((muscle) => [
			muscle.commonName,
			muscle.canonicalCommonName,
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
			media: baseMedia,
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
