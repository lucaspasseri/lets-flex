import { format } from "date-fns";

/** @param {Pick<import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData, "currentProgram" | "heatmap">} input */
export default function createHeatmapViewModel({ currentProgram, heatmap }) {
	const days = heatmap.flatMap((cycle) =>
		cycle.days.map((day) => ({ ...day, cycleName: cycle.cycleName })),
	);
	const finishedCount = days.reduce((sum, day) => sum + day.finishedCount, 0);
	const activeDays = days.filter((day) => day.finishedCount > 0);

	return {
		isVisible: Boolean(currentProgram),
		isEmpty: finishedCount === 0,
		headingId: "activity-heading",
		descriptionId: "activity-description",
		eyebrow: "Consistency",
		title: "Workout activity",
		description:
			"Finished workouts are placed on their actual completion date within the scheduled program calendar.",
		summary:
			finishedCount === 0
				? "No finished workouts fall inside this program calendar yet."
				: `${finishedCount} finished ${finishedCount === 1 ? "workout" : "workouts"} across ${activeDays.length} active ${activeDays.length === 1 ? "day" : "days"}.`,
		emptyState: {
			title: "No activity in this calendar yet",
			message: "Finished workouts will appear here on the date you complete them.",
		},
		weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
		legend: [
			{ label: "No finished workouts", modifier: "none", marker: "—" },
			{ label: "One finished workout", modifier: "one", marker: "1" },
			{ label: "Two or more finished workouts", modifier: "many", marker: "2+" },
		],
		cycles: heatmap.map((cycle) => ({
			id: cycle.cycleId,
			name: cycle.cycleName,
			finishedCount: cycle.days.reduce((sum, day) => sum + day.finishedCount, 0),
			days: cycle.days.map((day) => ({
				...day,
				dayLabel: format(day.date, "d"),
				marker: day.finishedCount === 0 ? "—" : String(day.finishedCount),
				accessibleLabel: `${format(day.date, "EEEE, MMMM d, yyyy")}: ${day.finishedCount === 0 ? "no finished workouts" : `${day.finishedCount} finished ${day.finishedCount === 1 ? "workout" : "workouts"}`}`,
				emptyCells: Array.from({ length: day.offset ?? 0 }, (_, index) => index),
				cellClass: `dashboard-heatmap__cell--${day.intensity}`,
			})),
		})),
		activityRows: activeDays.map((day) => ({
			dateKey: day.dateKey,
			dateLabel: format(day.date, "MMM d, yyyy"),
			cycleName: day.cycleName,
			finishedCount: day.finishedCount,
		})),
	};
}
