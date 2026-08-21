/**
 * @typedef {import("../../../src/features/goals/goals.types.js").Goal} Goal
 */

/** @param {{goals: Goal[]}} input */
export default function createProgramFormViewModel({ goals }) {
	return {
		modal: {
			id: "createProgramModal",
			title: "Create program",
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
			},
			{
				id: "program-goal-select",
				name: "goalId",
				label: "Goal",
				control: "select",
				required: true,
				options: goals.map(goal => ({ label: goal.name, value: goal.id })),
			},
			{
				id: "program-start-date-input",
				name: "startDate",
				label: "Start date",
				control: "input",
				type: "date",
				hint: "Leave empty to start today.",
			},
		],
		actions: {
			cancel: { label: "Cancel" },
			submit: { label: "Create program" },
		},
	};
}
