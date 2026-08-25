/** @param {Pick<import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData, "currentProgram" | "workoutSessions" | "barChart">} input */
export default function createBarChartViewModel({
	currentProgram,
	workoutSessions,
	barChart,
}) {
	return {
		isVisible: Boolean(currentProgram && workoutSessions.length > 0),
		labels: barChart.map((week) => week.label),
		scheduledCounts: barChart.map((week) => week.scheduledCount),
		finishedCounts: barChart.map((week) => week.finishedCount),
	};
}
