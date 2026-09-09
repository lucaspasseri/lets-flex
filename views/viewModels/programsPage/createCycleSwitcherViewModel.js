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
		eyebrow: "Level 2 · Cycles",
		heading: cycles.length === 0 ? "Create the first cycle" : "Choose a cycle",
		description: currentProgram
			? `Cycles break ${currentProgram.name} into focused blocks. Choose one to highlight its days.`
			: "Choose a program before managing its cycles.",
		items: cycles.map((cycle) => {
			const isCurrent = cycle.id === currentCycleId;

			return {
				id: cycle.id,
				name: cycle.name,
				badgeLabel: `C${cycle.order}`,
				metaLabel: `${cycle.size} ${cycle.size === 1 ? "day" : "days"}`,
				href: `/programs?programId=${currentProgram?.id}&cycleId=${cycle.id}`,
				isCurrent,
				statusLabel: isCurrent ? "Selected cycle" : "Choose cycle",
				statusIcon: isCurrent ? "check-circle" : "chevron-right",
				accessibleLabel: isCurrent
					? `${cycle.name}, selected cycle`
					: `Select cycle ${cycle.name}`,
				deleteAction: {
					modalId: "deleteCycleModal",
					accessibleLabel: `Delete cycle ${cycle.name}`,
					values: { id: cycle.id, name: cycle.name, entity: "cycle" },
				},
			};
		}),
		emptyState: {
			title: "Create the first cycle",
			description:
				"This program has no cycles yet. Creating one also creates its scheduled training days.",
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
