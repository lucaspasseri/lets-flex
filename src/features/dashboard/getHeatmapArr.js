import {
	addDays,
	startOfWeek,
	differenceInCalendarDays,
	format,
	isSameDay,
} from "date-fns";
import range from "../../../utils/range.js";

/**
 * @param {string | Date | null} startDate
 * @param {import("../cycles/cycles.types.js").Cycle[]} cycles
 * @param {import("../workoutSessions/workoutSessions.types.js").WorkoutSession[]} workoutSessions
 * @returns {Array<{cycleId: number, cycleName: string, days: Array<{date: Date, dateLabel: string, offset: number | null, intensity: "none" | "one" | "many"}>}>}
 */
export default function getHeatmapArr(startDate, cycles, workoutSessions) {
	if (!startDate) return [];

	let elapsedDays = 0;
	return cycles.map((cycle) => {
		const days = range(cycle.size).map((index) => {
			const date = addDays(startDate, elapsedDays + index);
			const finishedCount = workoutSessions.filter(
				(session) => session.finishedAt && isSameDay(date, session.finishedAt),
			).length;

			/** @type {"none" | "one" | "many"} */
			const intensity =
				finishedCount === 0 ? "none" : finishedCount === 1 ? "one" : "many";
			return {
				date,
				dateLabel: format(date, "dd/MM"),
				offset: index === 0 ? differenceInCalendarDays(date, startOfWeek(date)) : null,
				intensity,
			};
		});

		elapsedDays += cycle.size;
		return { cycleId: cycle.id, cycleName: cycle.name, days };
	});
}
