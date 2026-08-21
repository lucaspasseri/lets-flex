import formatProgramsPageDate from "./formatProgramsPageDate.js";

/**
 * @typedef {import("../../../src/features/programs/programs.types.js").Program} Program
 * @typedef {import("../../../src/features/cycles/cycles.types.js").Cycle} Cycle
 * @typedef {import("../../../src/features/trainingDays/trainingDays.types.js").TrainingDay} TrainingDay
 */

/**
 * @param {{currentProgram: Program | null, currentCycle: Cycle | null, trainingDays: TrainingDay[]}} input
 */
export default function createCalendarNavigationViewModel({
	currentProgram,
	currentCycle,
	trainingDays,
}) {
	return {
		id: "program-calendar",
		isVisible: currentProgram !== null,
		heading: currentProgram ? `${currentProgram.name} calendar` : "Program calendar",
		description: currentCycle
			? `${currentCycle.name} is highlighted. Choose any day to manage its workout.`
			: "Choose a cycle to highlight its training days.",
		items: trainingDays.map((day, index) => {
			const isInCurrentCycle = day.cycleId === currentCycle?.id;

			return {
				id: day.id,
				label: day.label ?? `Day ${day.dayOrder}`,
				dateLabel: formatProgramsPageDate(day.scheduledDate) ?? "Date pending",
				href: `/programs/day?dayId=${day.id}`,
				cycleId: day.cycleId,
				cycleOrder: day.cycleOrder,
				isFirst: index === 0,
				isInCurrentCycle,
				className: [
					"calendar-navigation__item",
					index === 0 && "calendar-navigation__item--first",
					isInCurrentCycle && "calendar-navigation__item--current-cycle",
				]
					.filter(Boolean)
					.join(" "),
				accessibleLabel: `Open ${day.label ?? `day ${day.dayOrder}`}, ${formatProgramsPageDate(day.scheduledDate) ?? "date pending"}`,
			};
		}),
		emptyState: {
			title: "No training days yet",
			description: "Create a cycle to populate this program's calendar.",
		},
	};
}
