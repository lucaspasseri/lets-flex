/**
 * @typedef {import("../../../src/features/goals/goals.types.js").Goal} Goal
 */

/** @param {{goals: Goal[], state?: Record<string, any>}} input */
export default function createProgramFormViewModel({ goals, state = {} }) {
	const values = state?.values && typeof state.values === "object" ? state.values : {};
	const errors = state?.errors ?? { fieldErrors: {}, formErrors: [] };
	const valueFor = (name) => (typeof values[name] === "string" ? values[name] : "");
	const errorFor = (name) => errors.fieldErrors?.[name] ?? null;

	return {
		modal: {
			id: "createProgramModal",
			title: "Create program",
			openOnLoad: Boolean(state.open),
		},
		form: {
			id: "create-program-form",
			heading: "Create program",
			description: "Define the goal and starting date for a new training plan.",
			action: "/programs",
		},
		fields: [
			{
				id: "program-name-input",
				name: "name",
				label: "Program name",
				control: "input",
				type: "text",
				required: true,
				hint: "Use a short name that describes this training plan.",
				attributes: { autocomplete: "off", maxlength: 100 },
				value: valueFor("name"),
				error: errorFor("name"),
			},
			{
				id: "program-goal-select",
				name: "goalId",
				label: "Goal",
				control: "select",
				required: true,
				options: goals.map((goal) => ({ label: goal.name, value: goal.id })),
				value: valueFor("goalId"),
				error: errorFor("goalId"),
			},
			{
				id: "program-start-date-input",
				name: "startDate",
				label: "Start date",
				control: "input",
				type: "date",
				hint: "Leave empty to start today.",
				value: valueFor("startDate"),
				error: errorFor("startDate"),
			},
		],
		formErrors: errors.formErrors ?? [],
		actions: {
			cancel: { label: "Cancel" },
			submit: { label: "Create program" },
		},
	};
}
