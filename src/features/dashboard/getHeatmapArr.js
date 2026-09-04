import { addDays, startOfWeek, differenceInCalendarDays, format } from "date-fns";
import range from "../../../utils/range.js";

/**
 * @param {string | Date | null} startDate
 * @param {import("../cycles/cycles.types.js").Cycle[]} cycles
 * @param {import("../programAnalytics/programAnalytics.types.js").ActivityBucket[]} activity
 * @returns {Array<{cycleId: number, cycleName: string, days: Array<{date: Date, dateKey: string, dateLabel: string, offset: number | null, intensity: "none" | "one" | "many", finishedCount: number}>}>}
 */
export default function getHeatmapArr(startDate, cycles, activity) {
	if (!startDate) return [];
	const finishedByDate = new Map(
		activity.map((bucket) => [bucket.dateKey, bucket.finishedCount]),
	);

	let elapsedDays = 0;
	return cycles.map((cycle) => {
		const days = range(cycle.size).map((index) => {
			const date = addDays(startDate, elapsedDays + index);
			const finishedCount = finishedByDate.get(format(date, "yyyy-MM-dd")) ?? 0;

			/** @type {"none" | "one" | "many"} */
			const intensity =
				finishedCount === 0 ? "none" : finishedCount === 1 ? "one" : "many";
			return {
				date,
				dateKey: format(date, "yyyy-MM-dd"),
				dateLabel: format(date, "dd/MM"),
				offset: index === 0 ? differenceInCalendarDays(date, startOfWeek(date)) : null,
				intensity,
				finishedCount,
			};
		});

		elapsedDays += cycle.size;
		return { cycleId: cycle.id, cycleName: cycle.name, days };
	});
}
