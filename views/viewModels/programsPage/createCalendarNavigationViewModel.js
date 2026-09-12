import formatProgramsPageDate from "./formatProgramsPageDate.js";
import createDayViewTransitionName from "../shared/createDayViewTransitionName.js";
import createSessionStatusMarkersViewModel from "../shared/createSessionStatusMarkersViewModel.js";

/**
 * @typedef {import("../../../src/features/programs/programs.types.js").Program} Program
 * @typedef {import("../../../src/features/cycles/cycles.types.js").Cycle} Cycle
 * @typedef {import("../../../src/features/trainingDays/trainingDays.types.js").TrainingDay} TrainingDay
 * @typedef {import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession} WorkoutSession
 */

/**
 * @param {{currentProgram: Program | null, currentCycle: Cycle | null, trainingDays: TrainingDay[], workoutSessions: WorkoutSession[], translate?: Function}} input
 */
export default function createCalendarNavigationViewModel({
	currentProgram,
	currentCycle,
	trainingDays,
	workoutSessions,
	translate,
}) {
	return {
		id: "program-calendar",
		isVisible: currentProgram !== null,
		eyebrow: "Level 3 · Training days",
		heading: currentProgram ? `${currentProgram.name} training days` : "Training days",
		description: currentCycle
			? `${currentCycle.name} is selected. Its days are highlighted in the full program calendar; open one to manage assigned sessions.`
			: "Choose a cycle above to highlight its days, then open a day to manage assigned sessions.",
		items: trainingDays.map((day, index) => {
			const isInCurrentCycle = day.cycleId === currentCycle?.id;
			const statusMarkers = createSessionStatusMarkersViewModel(
				workoutSessions.filter((session) => session.trainingDayId === day.id),
				translate,
			);

			return {
				id: day.id,
				viewTransitionName: createDayViewTransitionName(day.id),
				label: day.label ?? `Day ${day.dayOrder}`,
				dateLabel: formatProgramsPageDate(day.scheduledDate) ?? "Date pending",
				href: `/programs/day?dayId=${day.id}`,
				cycleId: day.cycleId,
				cycleOrder: day.cycleOrder,
				isFirst: index === 0,
				isInCurrentCycle,
				statusMarkers,
				className: [
					"calendar-navigation__item",
					index === 0 && "calendar-navigation__item--first",
					isInCurrentCycle && "calendar-navigation__item--current-cycle",
				]
					.filter(Boolean)
					.join(" "),
				accessibleLabel: `Open ${day.label ?? `day ${day.dayOrder}`}, ${formatProgramsPageDate(day.scheduledDate) ?? "date pending"}. ${statusMarkers.accessibleLabel}`,
			};
		}),
		emptyState: {
			title: "No training days yet",
			description:
				"Create a cycle above to generate its ordered, scheduled training days.",
		},
	};
}
