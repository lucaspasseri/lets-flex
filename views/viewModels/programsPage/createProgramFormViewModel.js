import formatGoalLabel from "./formatGoalLabel.js";
import createViewModelTranslator from "../translate.js";

/**
 * @typedef {import("../../../src/features/goals/goals.types.js").Goal} Goal
 */

/** @param {{goals: Goal[], state?: Record<string, any>, translate?: Function}} input */
export default function createProgramFormViewModel({ goals, state = {}, translate }) {
	const t = createViewModelTranslator(translate);
	const values = state?.values && typeof state.values === "object" ? state.values : {};
	const errors = state?.errors ?? { fieldErrors: {}, formErrors: [] };
	const valueFor = (name) => (typeof values[name] === "string" ? values[name] : "");
	const errorFor = (name) => errors.fieldErrors?.[name] ?? null;

	return {
		modal: {
			id: "createProgramModal",
			title: t("programs.createProgram", { defaultValue: "Create program" }),
			openOnLoad: Boolean(state.open),
		},
		form: {
			id: "create-program-form",
			heading: t("programs.createProgram", { defaultValue: "Create program" }),
			description: t("programs.createProgramDescription", {
				defaultValue: "Define the goal and starting date for a new training plan.",
			}),
			action: "/programs",
		},
		fields: [
			{
				id: "program-name-input",
				name: "name",
				label: t("programs.programName", { defaultValue: "Program name" }),
				control: "input",
				type: "text",
				required: true,
				hint: t("programs.programNameHint", {
					defaultValue: "Use a short name that describes this training plan.",
				}),
				attributes: { autocomplete: "off", maxlength: 100 },
				value: valueFor("name"),
				error: errorFor("name"),
			},
			{
				id: "program-goal-select",
				name: "goalId",
				label: t("programs.goal", { defaultValue: "Goal" }),
				control: "select",
				required: true,
				options: goals.map((goal) => ({
					label: formatGoalLabel(goal.name, t),
					value: goal.id,
				})),
				value: valueFor("goalId"),
				error: errorFor("goalId"),
			},
			{
				id: "program-start-date-input",
				name: "startDate",
				label: t("programs.startDate", { defaultValue: "Start date" }),
				control: "input",
				type: "date",
				hint: t("programs.startDateHint", {
					defaultValue: "Leave empty to start today.",
				}),
				value: valueFor("startDate"),
				error: errorFor("startDate"),
			},
		],
		formErrors: errors.formErrors ?? [],
		actions: {
			cancel: { label: t("actions.cancel", { defaultValue: "Cancel" }) },
			submit: {
				label: t("programs.createProgram", { defaultValue: "Create program" }),
			},
		},
	};
}
