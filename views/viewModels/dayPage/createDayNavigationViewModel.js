import formatDayPageDate from "./formatDayPageDate.js";

/**
 * @typedef {import("../../../src/features/trainingDays/trainingDays.types.js").TrainingDay} TrainingDay
 * @param {{currentDay: TrainingDay | null, days: TrainingDay[], programName?: string | null, cycleName?: string | null}} input
 */
export default function createDayNavigationViewModel({
	currentDay,
	days,
	programName = null,
	cycleName = null,
}) {
	const currentIndex = currentDay
		? days.findIndex((day) => day.id === currentDay.id)
		: -1;

	/** @param {TrainingDay | undefined} day */
	const toLink = (day) =>
		day
			? {
					id: day.id,
					label: formatDayPageDate(day.scheduledDate) ?? "Date pending",
					name: day.label?.trim() || `Day ${day.dayOrder}`,
					contextLabel: `Cycle ${day.cycleOrder} · Day ${day.dayOrder}`,
					href: `/programs/day?dayId=${day.id}`,
				}
			: null;

	return {
		isVisible: days.length > 0,
		heading: programName ? `${programName} training days` : "Choose a training day",
		description: cycleName
			? `${cycleName} contains the selected day. You can also open another day in this program.`
			: "Open another scheduled day in this program.",
		previous: currentIndex > 0 ? toLink(days[currentIndex - 1]) : null,
		next:
			currentIndex >= 0 && currentIndex < days.length - 1
				? toLink(days[currentIndex + 1])
				: null,
		items: days.map((day) => ({
			...toLink(day),
			isCurrent: day.id === currentDay?.id,
		})),
	};
}
