import formatDayPageDate from "./formatDayPageDate.js";

/**
 * @typedef {import("../../../src/features/trainingDays/trainingDays.types.js").TrainingDay} TrainingDay
 * @param {{currentDay: TrainingDay | null, days: TrainingDay[]}} input
 */
export default function createDayNavigationViewModel({ currentDay, days }) {
	const currentIndex = currentDay
		? days.findIndex((day) => day.id === currentDay.id)
		: -1;

	/** @param {TrainingDay | undefined} day */
	const toLink = (day) =>
		day
			? {
					id: day.id,
					label: formatDayPageDate(day.scheduledDate) ?? "Date pending",
					href: `/programs/day?dayId=${day.id}`,
				}
			: null;

	return {
		isVisible: days.length > 0,
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
