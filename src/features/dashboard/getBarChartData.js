import { format, parseISO } from "date-fns";

/**
 * @param {import("../programAnalytics/programAnalytics.types.js").AdherenceBucket[]} adherence
 */
export default function getBarChartData(adherence) {
	return adherence.map((week) => {
		const date = parseISO(week.weekStartDate);
		return {
			date,
			label: format(date, "dd/MM"),
			scheduledCount: week.scheduledCount,
			finishedCount: week.finishedCount,
			cancelledCount: week.cancelledCount,
			completionRate: week.completionRate,
		};
	});
}
