/**
 * @typedef {import("../../../src/features/programs/programs.types.js").Program} Program
 * @typedef {import("../../../src/features/cycles/cycles.types.js").Cycle} Cycle
 */

/** @param {{currentProgram: Program | null, cycles: Cycle[], state?: Record<string, any>, translate?: Function}} input */
export default function createCycleFormViewModel({
	currentProgram,
	cycles,
	state = {},
	translate,
}) {
	const t = createViewModelTranslator(translate);
	const values = state?.values && typeof state.values === "object" ? state.values : {};
	const errors = state?.errors ?? { fieldErrors: {}, formErrors: [] };
	const valueFor = (name) => (typeof values[name] === "string" ? values[name] : "");
	const errorFor = (name) => errors.fieldErrors?.[name] ?? null;
	const orderOptions = Array.from({ length: cycles.length + 1 }, (_, index) => ({
		label: t("programs.position", {
			count: index + 1,
			defaultValue: "Position {{count}}",
		}),
		value: index + 1,
	}));

	return {
		modal: {
			id: "createCycleModal",
			title: t("programs.createCycle", { defaultValue: "Create cycle" }),
			openOnLoad: Boolean(state.open),
		},
		form: {
			id: "create-cycle-form",
			heading: t("programs.createCycle", { defaultValue: "Create cycle" }),
			description: currentProgram
				? t("programs.addCycleTo", {
						name: currentProgram.name,
						defaultValue: "Add a training cycle to {{name}}.",
					})
				: t("programs.chooseProgramBeforeCycle", {
						defaultValue: "Choose a program before creating a cycle.",
					}),
			action: "/cycles",
		},
		fields: [
			{
				id: "cycle-name-input",
				name: "name",
				label: t("programs.cycleName", { defaultValue: "Cycle name" }),
				control: "input",
				type: "text",
				required: true,
				hint: t("programs.cycleNameHint", {
					defaultValue: "For example: Foundation or Strength block.",
				}),
				attributes: { autocomplete: "off", maxlength: 100 },
				value: valueFor("name"),
				error: errorFor("name"),
			},
			{
				id: "cycle-size-input",
				name: "cycleSize",
				label: t("programs.numberOfDays", { defaultValue: "Number of days" }),
				control: "input",
				type: "number",
				required: true,
				attributes: { min: 1, step: 1, inputmode: "numeric" },
				value: valueFor("cycleSize"),
				error: errorFor("cycleSize"),
			},
			{
				id: "cycle-order-select",
				name: "cycleOrder",
				label: t("programs.positionInProgram", { defaultValue: "Position in program" }),
				control: "select",
				required: true,
				options: orderOptions,
				value: valueFor("cycleOrder"),
				error: errorFor("cycleOrder"),
			},
		],
		formErrors: errors.formErrors ?? [],
		actions: {
			cancel: { label: t("actions.cancel", { defaultValue: "Cancel" }) },
			submit: {
				label: t("programs.createCycle", { defaultValue: "Create cycle" }),
				disabled: currentProgram === null,
			},
		},
	};
}
import createViewModelTranslator from "../translate.js";
