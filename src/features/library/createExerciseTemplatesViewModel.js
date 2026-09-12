import createExercise from "./createExerciseViewModel.js";
import createDiscoveryFilterOptions from "./createDiscoveryFilterOptions.js";
import translateCount from "../../infrastructure/i18n/translateCount.js";
import translateMessage from "../../infrastructure/i18n/translateMessage.js";

/**
 * @typedef { import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMapper} ExerciseTemplateMapper
 * @typedef { import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplatesViewModel} ExerciseTemplatesViewModel
 */

/**
 * @typedef {object} CreateExerciseTemplateInput
 * @property {ExerciseTemplateMapper[]} exerciseTemplateArr
 * @property {number | null} actorUserId
 * @property {boolean} managementMode
 * @property {Record<string, any>} [privateVariantMutationState]
 * @property {Function} [translate]
 */

/**
 *
 * @param {CreateExerciseTemplateInput} input
 * @returns {ExerciseTemplatesViewModel}
 */

function createExerciseTemplates({
	exerciseTemplateArr = [],
	actorUserId = null,
	managementMode = false,
	privateVariantMutationState,
	translate,
}) {
	const t = (key, options = {}) =>
		translateMessage(translate, key, String(options.defaultValue ?? ""), options);
	const groupedExercises = /** @type {Map<number, ExerciseTemplateMapper[]>} */ (
		new Map()
	);
	for (const exerciseTemplate of exerciseTemplateArr) {
		const existingGroup = groupedExercises.get(exerciseTemplate.id) ?? [];
		existingGroup.push(exerciseTemplate);
		groupedExercises.set(exerciseTemplate.id, existingGroup);
	}

	const items = [...groupedExercises.values()]
		.map((exerciseTemplates) =>
			createExercise({
				exerciseTemplates,
				actorUserId,
				managementMode,
				privateVariantMutationState,
				translate,
			}),
		)
		.sort((first, second) => first.baseName.localeCompare(second.baseName));
	const exerciseCount = items.length;
	const variantCount = exerciseTemplateArr.length;
	const filterDefinitions = [
		{
			name: "movement",
			label: t("library.movementPattern", { defaultValue: "Movement pattern" }),
			allLabel: t("library.allMovements", { defaultValue: "All movements" }),
			level: /** @type {const} */ ("base"),
			options: createDiscoveryFilterOptions(
				items.flatMap((item) => item.filters.movement),
			),
		},
		{
			name: "muscle",
			label: t("library.muscle", { defaultValue: "Muscle" }),
			allLabel: t("library.allMuscles", { defaultValue: "All muscles" }),
			level: /** @type {const} */ ("base"),
			options: createDiscoveryFilterOptions(
				items.flatMap((item) => item.filters.muscle),
			),
		},
		{
			name: "equipment",
			label: t("library.equipment", { defaultValue: "Equipment" }),
			allLabel: t("library.allEquipment", { defaultValue: "All equipment" }),
			level: /** @type {const} */ ("variant"),
			options: createDiscoveryFilterOptions(
				items.flatMap((item) =>
					item.details.variants.flatMap((variant) => variant.filters.equipment),
				),
			),
		},
		{
			name: "environment",
			label: t("library.environment", { defaultValue: "Environment" }),
			allLabel: t("library.allEnvironments", { defaultValue: "All environments" }),
			level: /** @type {const} */ ("variant"),
			options: createDiscoveryFilterOptions(
				items.flatMap((item) =>
					item.details.variants.flatMap((variant) => variant.filters.environment),
				),
			),
		},
		{
			name: "scope",
			label: t("library.availability", { defaultValue: "Availability" }),
			allLabel: t("library.allAvailability", { defaultValue: "All availability" }),
			level: /** @type {const} */ ("variant"),
			options: createDiscoveryFilterOptions(
				items.flatMap((item) =>
					item.details.variants.flatMap((variant) => variant.filters.scope),
				),
			),
		},
	].filter((filter) => filter.options.length > 1);

	return {
		id: "exercise-templates",
		label: managementMode
			? t("library.globalExerciseCatalog", { defaultValue: "Global exercise catalog" })
			: t("library.availableExercises", { defaultValue: "Available exercises" }),
		description: managementMode
			? t("library.globalExerciseDescription", {
					defaultValue:
						"Only global exercises and sample variants are shown in this administrator view.",
				})
			: t("library.availableExercisesDescription", {
					defaultValue:
						"Global exercises are available to everyone; variants you create remain private to you.",
				}),

		count: exerciseCount,
		variantCount,
		countLabel: translateCount(translate, "library.catalogCount", exerciseCount, {
			exerciseCount,
			variantLabel: translateCount(translate, "library.variantCount", variantCount, {
				one: "{{count}} variant",
				other: "{{count}} variants",
			}),
			one: "{{exerciseCount}} exercise · {{variantLabel}}",
			other: "{{exerciseCount}} exercises · {{variantLabel}}",
		}),

		emptyState: {
			title: t("library.noExerciseTemplates", {
				defaultValue: "No exercise templates yet",
			}),
			description: t("library.noExerciseTemplatesDescription", {
				defaultValue:
					"Create your first exercise template to start building reusable training sessions.",
			}),
			icon: "dumbbell",
		},

		items,

		actions: {
			create: {
				isVisible: managementMode,
				label: t("library.createExerciseTemplate", {
					defaultValue: "Create exercise template",
				}),
				modalId: "createExerciseModal",
			},
		},

		discovery: {
			id: "exercise-discovery",
			title: t("library.findExercise", { defaultValue: "Find an exercise" }),
			description: t("library.findExerciseDescription", {
				defaultValue:
					"Search base exercises or variant details, then narrow the catalog by movement, muscle, equipment, or environment.",
			}),
			searchLabel: t("library.searchExercises", { defaultValue: "Search exercises" }),
			searchPlaceholder: t("library.searchExercisesPlaceholder", {
				defaultValue: "Search exercises, variants, or setup notes",
			}),
			filters: filterDefinitions,
		},
	};
}

export default createExerciseTemplates;
