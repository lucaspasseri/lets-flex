/** @param {Pick<import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData, "currentProgram" | "heatmap">} input */
export default function createHeatmapViewModel({ currentProgram, heatmap }) {
	return {
		isVisible: Boolean(currentProgram),
		title: `${currentProgram?.name?.toUpperCase() ?? "PROGRAM"}'S METRICS`,
		weekdays: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
		cycles: heatmap.map(cycle => ({
			id: cycle.cycleId,
			name: cycle.cycleName,
		days: cycle.days.map(day => ({
			...day,
			emptyCells: Array.from({ length: day.offset ?? 0 }, (_, index) => index),
			cellClass: `${day.intensity === "none" ? "no" : day.intensity}-workout-session`,
		})),
		})),
	};
}
