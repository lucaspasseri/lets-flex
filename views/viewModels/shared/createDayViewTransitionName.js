import createViewTransitionName from "./createViewTransitionName.js";

/** @param {number | null} dayId */
export default function createDayViewTransitionName(dayId) {
	return createViewTransitionName("program-calendar-day", dayId);
}
