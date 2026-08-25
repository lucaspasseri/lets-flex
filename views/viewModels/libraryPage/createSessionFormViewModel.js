/**
 * @typedef {import("../../../src/features/stepTypes/stepTypes.types.js").StepTypeViewModel} StepType
 * @typedef {import("../../../src/features/exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMapper} ExerciseTemplate
 */

/**
 * @param {{stepTypes: StepType[], exerciseTemplates: ExerciseTemplate[], state?: Record<string, any>, mode?: "create" | "update"}} input
 */
export default function createSessionFormViewModel({
	stepTypes,
	exerciseTemplates,
	state = {},
	mode = "create",
}) {
	const isUpdate = mode === "update";
	const values = state.values ?? {};
	const errors = state.errors ?? { fieldErrors: {}, formErrors: [] };
	const idPrefix = isUpdate ? "update-session" : "create-session";
	const stepRow = Array.isArray(values.stepRow)
		? values.stepRow.filter((/** @type {any} */ item) => item && typeof item === "object")
		: [];
	return {
		modal: {
			id: isUpdate ? "updateSessionModal" : "createSessionModal",
			title: isUpdate ? "Update session template" : "Create session template",
			openOnLoad: Boolean(state.open),
		},
		form: {
			id: `${idPrefix}-template-form`,
			heading: isUpdate ? "Update session template" : "Create session template",
			description: "Define a reusable session template.",
			action: isUpdate
				? `/sessions/${state.sessionId}?_method=PATCH`
				: "/sessions",
		},
		fields: {
			idPrefix,
			values: {
				name: typeof values.name === "string" ? values.name : "",
				notes: typeof values.notes === "string" ? values.notes : "",
				stepRow,
			},
			errors: errors.fieldErrors ?? {},
			formErrors: errors.formErrors ?? [],
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
			submit: { label: isUpdate ? "Update session" : "Create session" },
			addStep: { label: "Add step" },
		},
	};
}
