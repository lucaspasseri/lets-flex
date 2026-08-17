/**
 * @typedef {import("../../../src/features/stepTypes/stepTypes.types.js").StepTypeViewModel} StepType
 * @typedef {import("../../../src/features/exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMapper} ExerciseTemplate
 */

/**
 * @param {{stepTypes: StepType[], exerciseTemplates: ExerciseTemplate[]}} input
 */
export default function createSessionFormViewModel({
	stepTypes,
	exerciseTemplates,
}) {
	return {
		modal: {
			id: "createSessionModal",
			title: "Create session template",
		},
		form: {
			id: "create-session-template-form",
			heading: "Create session template",
			description: "Define a reusable session template.",
			action: "/sessions",
		},
		fields: {
			stepTypeOptions: stepTypes.map(stepType => ({
				label: stepType.name,
				value: stepType.id,
			})),
			exerciseOptions: exerciseTemplates.map(exercise => ({
				label: exercise.name,
				value: exercise.variant.id,
			})),
			loadUnitOptions: [
				{ label: "Kg", value: "Kilograms" },
				{ label: "lb", value: "Pounds" },
			],
		},
		actions: {
			cancel: { label: "Cancel" },
			submit: { label: "Create session" },
			addStep: { label: "Add step" },
		},
	};
}
