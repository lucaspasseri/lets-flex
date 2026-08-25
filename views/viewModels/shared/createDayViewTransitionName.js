/** @param {number | null} dayId */
export default function createDayViewTransitionName(dayId) {
	return dayId === null ? null : `program-calendar-day-${dayId}`;
}
