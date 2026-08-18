/**
 * @typedef {import("../../../src/features/programs/programs.types.js").Program} Program
 * @typedef {import("../../../src/features/cycles/cycles.types.js").Cycle} Cycle
 */

/** @param {{currentProgram: Program | null, cycles: Cycle[]}} input */
export default function createCycleFormViewModel({ currentProgram, cycles }) {
	const orderOptions = Array.from({ length: cycles.length + 1 }, (_, index) => ({
		label: `Position ${index + 1}`,
		value: index + 1,
	}));

	return {
		modal: {
			id: "createCycleModal",
			title: "Create cycle",
		},
		form: {
			id: "create-cycle-form",
			heading: "Create cycle",
			description: currentProgram
				? `Add a training cycle to ${currentProgram.name}.`
				: "Choose a program before creating a cycle.",
			action: "/cycles",
		},
		fields: [
			{
				id: "cycle-name-input",
				name: "name",
				label: "Cycle name",
				control: "input",
				type: "text",
				required: true,
				hint: "For example: Foundation or Strength block.",
				attributes: { autocomplete: "off", maxlength: 100 },
			},
			{
				id: "cycle-size-input",
				name: "cycleSize",
				label: "Number of days",
				control: "input",
				type: "number",
				required: true,
				attributes: { min: 1, step: 1, inputmode: "numeric" },
			},
			{
				id: "cycle-order-select",
				name: "cycleOrder",
				label: "Position in program",
				control: "select",
				required: true,
				options: orderOptions,
			},
		],
		actions: {
			cancel: { label: "Cancel" },
			submit: {
				label: "Create cycle",
				disabled: currentProgram === null,
			},
		},
	};
}
