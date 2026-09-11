/**
 * @typedef {import("../../../src/features/stepTypes/stepTypes.types.js").StepTypeViewModel} StepType
 * @typedef {import("../../../src/features/exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMapper} ExerciseTemplate
 */

import formatDayPageDate from "../dayPage/formatDayPageDate.js";

/**
 * @param {{stepTypes: StepType[], exerciseTemplates: ExerciseTemplate[], state?: Record<string, any>, mode?: "create" | "update", creationContext?: import("../../../src/features/trainingDays/trainingDays.types.js").TrainingDayContext | null}} input
 */
export default function createSessionFormViewModel({
	stepTypes,
	exerciseTemplates,
	state = {},
	mode = "create",
	creationContext = null,
}) {
	const isUpdate = mode === "update";
	const contextDayTitle = creationContext
		? creationContext.day.label?.trim() || `Day ${creationContext.day.dayOrder}`
		: null;
	const values = state.values ?? {};
	const errors = state.errors ?? { fieldErrors: {}, formErrors: [] };
	const idPrefix = isUpdate ? "update-session" : "create-session";
	const contextDayId = !isUpdate
		? (creationContext?.day.id ?? values.contextDayId ?? null)
		: null;
	const stepRow = Array.isArray(values.stepRow)
		? values.stepRow.filter(
				(/** @type {any} */ item) => item && typeof item === "object",
			)
		: [];
	return {
		modal: {
			id: isUpdate ? "updateSessionModal" : "createSessionModal",
			title: isUpdate
				? "Update session template"
				: creationContext
					? "Create and return to training day"
					: "Create session template",
			openOnLoad: Boolean(state.open || (!isUpdate && creationContext)),
		},
		form: {
			id: `${idPrefix}-template-form`,
			heading: isUpdate
				? "Update session template"
				: contextDayTitle
					? `Create a session for ${contextDayTitle}`
					: "Create session template",
			description:
				!isUpdate && creationContext
					? "Define a reusable template. You will review and assign it after returning to the training day."
					: "Define a reusable session template.",
			action: isUpdate ? `/sessions/${state.sessionId}?_method=PATCH` : "/sessions",
		},
		fields: {
			idPrefix,
			values: {
				name: typeof values.name === "string" ? values.name : "",
				notes: typeof values.notes === "string" ? values.notes : "",
				stepRow,
			},
			errors: errors.fieldErrors ?? {},
			formErrors: [
				...(errors.formErrors ?? []),
				...(errors.fieldErrors?.contextDayId ? [errors.fieldErrors.contextDayId] : []),
			],
			contextDayId,
			creationContext:
				!isUpdate && creationContext
					? {
							pathLabel: `${creationContext.program.name} · ${creationContext.cycle.name} · ${contextDayTitle}`,
							dateLabel:
								formatDayPageDate(creationContext.day.scheduledDate) ??
								"Date not scheduled",
						}
					: null,
			stepTypeOptions: stepTypes.map((stepType) => ({
				label: stepType.name,
				value: stepType.id,
			})),
			exerciseOptions: exerciseTemplates.map((exercise) => ({
				label: `${exercise.name} — ${exercise.variant.name}${exercise.variant.ownerUserId == null ? "" : " (Private)"}`,
				value: exercise.variant.id,
			})),
			loadUnitOptions: [
				{ label: "Kg", value: "Kilograms" },
				{ label: "lb", value: "Pounds" },
			],
		},
		actions: {
			cancel: { label: "Cancel" },
			submit: {
				label: isUpdate
					? "Update session"
					: creationContext
						? "Create and return"
						: "Create session",
			},
			addStep: { label: "Add step" },
		},
	};
}
