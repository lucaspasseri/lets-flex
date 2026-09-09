import createExercise from "./createExerciseViewModel.js";
import createDiscoveryFilterOptions from "./createDiscoveryFilterOptions.js";

/**
 * @typedef { import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMapper} ExerciseTemplateMapper
 * @typedef { import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplatesViewModel} ExerciseTemplatesViewModel
 */

/**
 * @typedef {object} CreateExerciseTemplateInput
 * @property {ExerciseTemplateMapper[]} exerciseTemplateArr
 * @property {number | null} actorUserId
 * @property {boolean} managementMode
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
}) {
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
			createExercise({ exerciseTemplates, actorUserId, managementMode }),
		)
		.sort((first, second) => first.baseName.localeCompare(second.baseName));
	const exerciseCount = items.length;
	const variantCount = exerciseTemplateArr.length;
	const filterDefinitions = [
		{
			name: "movement",
			label: "Movement pattern",
			allLabel: "All movements",
			level: /** @type {const} */ ("base"),
			options: createDiscoveryFilterOptions(
				items.flatMap((item) => item.filters.movement),
			),
		},
		{
			name: "muscle",
			label: "Muscle",
			allLabel: "All muscles",
			level: /** @type {const} */ ("base"),
			options: createDiscoveryFilterOptions(
				items.flatMap((item) => item.filters.muscle),
			),
		},
		{
			name: "equipment",
			label: "Equipment",
			allLabel: "All equipment",
			level: /** @type {const} */ ("variant"),
			options: createDiscoveryFilterOptions(
				items.flatMap((item) =>
					item.details.variants.flatMap((variant) => variant.filters.equipment),
				),
			),
		},
		{
			name: "environment",
			label: "Environment",
			allLabel: "All environments",
			level: /** @type {const} */ ("variant"),
			options: createDiscoveryFilterOptions(
				items.flatMap((item) =>
					item.details.variants.flatMap((variant) => variant.filters.environment),
				),
			),
		},
		{
			name: "scope",
			label: "Availability",
			allLabel: "All availability",
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
		label: managementMode ? "Global exercise catalog" : "Available exercises",
		description: managementMode
			? "Only global exercises and sample variants are shown in this administrator view."
			: "Global exercises are available to everyone; variants you create remain private to you.",

		count: exerciseCount,
		variantCount,
		countLabel: `${exerciseCount} ${exerciseCount === 1 ? "exercise" : "exercises"} · ${variantCount} ${variantCount === 1 ? "variant" : "variants"}`,

		emptyState: {
			title: "No exercise templates yet",
			description:
				"Create your first exercise template to start building reusable training sessions.",
			icon: "dumbbell",
		},

		items,

		actions: {
			create: {
				isVisible: managementMode,
				label: "Create exercise template",
				modalId: "createExerciseModal",
			},
		},

		discovery: {
			id: "exercise-discovery",
			title: "Find an exercise",
			description:
				"Search base exercises or variant details, then narrow the catalog by movement, muscle, equipment, or environment.",
			searchLabel: "Search exercises",
			searchPlaceholder: "Search exercises, variants, or setup notes",
			filters: filterDefinitions,
		},
	};
}

export default createExerciseTemplates;
