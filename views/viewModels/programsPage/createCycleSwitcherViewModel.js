/**
 * @typedef {import("../../../src/features/programs/programs.types.js").Program} Program
 * @typedef {import("../../../src/features/cycles/cycles.types.js").Cycle} Cycle
 */

/**
 * @param {{currentProgram: Program | null, currentCycleId: Cycle["id"] | null, cycles: Cycle[]}} input
 */
export default function createCycleSwitcherViewModel({
	currentProgram,
	currentCycleId,
	cycles,
}) {
	return {
		id: "cycle-switcher",
		isVisible: currentProgram !== null,
		eyebrow: "Cycles",
		heading: cycles.length === 0 ? "Create the first cycle" : "Choose a cycle",
		description: currentProgram
			? `Manage the training cycles in ${currentProgram.name}.`
			: "Choose a program before managing its cycles.",
		items: cycles.map(cycle => {
			const isCurrent = cycle.id === currentCycleId;

			return {
				id: cycle.id,
				name: cycle.name,
				badgeLabel: `C${cycle.order}`,
				metaLabel: `${cycle.size} ${cycle.size === 1 ? "day" : "days"}`,
				href: `/programs?programId=${currentProgram?.id}&cycleId=${cycle.id}`,
				isCurrent,
				statusLabel: isCurrent ? "Active cycle" : null,
				accessibleLabel: isCurrent
					? `${cycle.name}, active cycle`
					: `Select cycle ${cycle.name}`,
			};
		}),
		emptyState: {
			title: "Create the first cycle",
			description: "Cycles divide a program into manageable blocks of training days.",
			icon: "repeat-2",
		},
		createAction: {
			label: "New cycle",
			accessibleLabel: "Create a new cycle",
			modalId: "createCycleModal",
			icon: "plus",
			disabled: currentProgram === null,
		},
	};
}
