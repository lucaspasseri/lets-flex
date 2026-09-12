import createViewModelTranslator, { translateCount } from "../translate.js";

/**
 * @typedef {import("../../../src/features/programs/programs.types.js").Program} Program
 * @typedef {import("../../../src/features/cycles/cycles.types.js").Cycle} Cycle
 */

/**
 * @param {{currentProgram: Program | null, currentCycleId: Cycle["id"] | null, cycles: Cycle[], translate?: Function}} input
 */
export default function createCycleSwitcherViewModel({
	currentProgram,
	currentCycleId,
	cycles,
	translate,
}) {
	const t = createViewModelTranslator(translate);
	return {
		id: "cycle-switcher",
		listLabel: t("programs.availableCycles", { defaultValue: "Available cycles" }),
		isVisible: currentProgram !== null,
		eyebrow: t("programs.levelCycles", { defaultValue: "Level 2 · Cycles" }),
		heading:
			cycles.length === 0
				? t("programs.createFirstCycle", { defaultValue: "Create the first cycle" })
				: t("programs.chooseCycle", { defaultValue: "Choose a cycle" }),
		description: currentProgram
			? t("programs.cyclesDescription", {
					name: currentProgram.name,
					defaultValue:
						"Cycles break {{name}} into focused blocks. Choose one to highlight its days.",
				})
			: t("programs.chooseProgramFirst", {
					defaultValue: "Choose a program before managing its cycles.",
				}),
		items: cycles.map((cycle) => {
			const isCurrent = cycle.id === currentCycleId;

			return {
				id: cycle.id,
				name: cycle.name,
				badgeLabel: `C${cycle.order}`,
				metaLabel: translateCount(translate, "programs.cycleDays", cycle.size, {
					one: "{{count}} day",
					other: "{{count}} days",
				}),
				href: `/programs?programId=${currentProgram?.id}&cycleId=${cycle.id}`,
				isCurrent,
				statusLabel: isCurrent
					? t("programs.selectedCycleStatus", { defaultValue: "Selected cycle" })
					: t("programs.chooseCycleStatus", { defaultValue: "Choose cycle" }),
				statusIcon: isCurrent ? "check-circle" : "chevron-right",
				accessibleLabel: isCurrent
					? t("programs.selectedCycle", {
							name: cycle.name,
							defaultValue: "{{name}}, selected cycle",
						})
					: t("programs.selectCycle", {
							name: cycle.name,
							defaultValue: "Select cycle {{name}}",
						}),
				deleteAction: {
					modalId: "deleteCycleModal",
					accessibleLabel: t("programs.deleteCycle", {
						name: cycle.name,
						defaultValue: "Delete cycle {{name}}",
					}),
					values: { id: cycle.id, name: cycle.name, entity: "cycle" },
				},
			};
		}),
		emptyState: {
			title: t("programs.createFirstCycle", { defaultValue: "Create the first cycle" }),
			description: t("programs.createCycleDescription", {
				defaultValue:
					"This program has no cycles yet. Creating one also creates its scheduled training days.",
			}),
			icon: "repeat-2",
		},
		createAction: {
			label: t("programs.newCycle", { defaultValue: "New cycle" }),
			accessibleLabel: t("programs.createNewCycle", {
				defaultValue: "Create a new cycle",
			}),
			modalId: "createCycleModal",
			icon: "plus",
			disabled: currentProgram === null,
		},
	};
}
