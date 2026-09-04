import { format, parseISO } from "date-fns";

/** @param {Pick<import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData, "currentProgram" | "analytics">} input */
export default function createBarChartViewModel({ currentProgram, analytics }) {
	const weeks = analytics.adherence;
	const scheduledCount = weeks.reduce((sum, week) => sum + week.scheduledCount, 0);
	const finishedCount = weeks.reduce((sum, week) => sum + week.finishedCount, 0);
	const cancelledCount = weeks.reduce((sum, week) => sum + week.cancelledCount, 0);
	const completionPercentage =
		scheduledCount === 0 ? null : Math.round((finishedCount / scheduledCount) * 100);
	const rows = weeks.map((week) => {
		const startDate = parseISO(week.weekStartDate);
		const endDate = parseISO(week.weekEndDate);
		const completionPercentage =
			week.completionRate === null ? null : Math.round(week.completionRate * 100);
		return {
			weekLabel: `Week ${week.weekIndex + 1}`,
			shortLabel: `W${week.weekIndex + 1}`,
			rangeLabel: `${format(startDate, "MMM d")}–${format(endDate, "MMM d")}`,
			scheduledCount: week.scheduledCount,
			finishedCount: week.finishedCount,
			cancelledCount: week.cancelledCount,
			remainingCount: week.plannedCount + week.inProgressCount,
			completionLabel:
				completionPercentage === null
					? "No sessions scheduled"
					: `${completionPercentage}% complete`,
		};
	});

	return {
		isVisible: Boolean(currentProgram),
		isEmpty: scheduledCount === 0,
		showChart: scheduledCount > 0,
		headingId: "adherence-heading",
		descriptionId: "adherence-description",
		eyebrow: "Follow-through",
		title: "Scheduled adherence",
		description:
			"Finished sessions stay in their scheduled program week. Cancelled sessions remain visible and never count as finished.",
		summary:
			completionPercentage === null
				? "No sessions are scheduled inside this program calendar yet."
				: `${completionPercentage}% complete · ${finishedCount} finished · ${cancelledCount} cancelled`,
		emptyState: {
			title: "No adherence data yet",
			message:
				"Schedule sessions in this program to compare planned and finished training by week.",
		},
		legend: [
			{ label: "Scheduled", modifier: "scheduled" },
			{ label: "Finished", modifier: "finished" },
			{ label: "Cancelled", modifier: "cancelled" },
		],
		labels: rows.map((week) => week.shortLabel),
		scheduledCounts: rows.map((week) => week.scheduledCount),
		finishedCounts: rows.map((week) => week.finishedCount),
		cancelledCounts: rows.map((week) => week.cancelledCount),
		rows,
	};
}
