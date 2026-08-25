import { addDays, startOfWeek, format, isSameWeek } from "date-fns";

/**
 * @param {string | Date | null} startDate
 * @param {import("../cycles/cycles.types.js").Cycle[]} cycles
 * @param {import("../workoutSessions/workoutSessions.types.js").WorkoutSession[]} workoutSessions
 */
export default function getBarChartData(startDate, cycles, workoutSessions) {
	if (!startDate) return [];

	const totalDays = cycles.reduce((sum, cycle) => sum + cycle.size, 0);
	return Array.from({ length: Math.ceil(totalDays / 7) }, (_, index) => {
		const date = startOfWeek(addDays(startDate, index * 7));
		/** @param {string | Date | null | undefined} value */
		const inWeek = (value) => Boolean(value && isSameWeek(date, value));

		return {
			date,
			label: format(date, "dd/MM"),
			scheduledCount: workoutSessions.filter((session) => inWeek(session.scheduledDate))
				.length,
			finishedCount: workoutSessions.filter((session) => inWeek(session.finishedAt))
				.length,
		};
	});
}
