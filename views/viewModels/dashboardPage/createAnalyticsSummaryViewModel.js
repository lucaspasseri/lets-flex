const numberFormatter = new Intl.NumberFormat("en-US");

/** @param {number} value */
function formatNumber(value) {
	return numberFormatter.format(value);
}

/** @param {import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData} input */
export default function createAnalyticsSummaryViewModel({ currentProgram, analytics }) {
	const scheduledCount = analytics.adherence.reduce(
		(sum, week) => sum + week.scheduledCount,
		0,
	);
	const finishedScheduledCount = analytics.adherence.reduce(
		(sum, week) => sum + week.finishedCount,
		0,
	);
	const cancelledCount = analytics.adherence.reduce(
		(sum, week) => sum + week.cancelledCount,
		0,
	);
	const finishedActivityCount = analytics.activity.reduce(
		(sum, day) => sum + day.finishedCount,
		0,
	);
	const activeDayCount = analytics.activity.filter(
		(day) => day.finishedCount > 0,
	).length;
	const completionPercentage =
		scheduledCount === 0
			? null
			: Math.round((finishedScheduledCount / scheduledCount) * 100);
	const isEmpty =
		scheduledCount === 0 &&
		finishedActivityCount === 0 &&
		analytics.performedWork.performedStepCount === 0;

	return {
		isVisible: Boolean(currentProgram),
		headingId: "program-analytics-heading",
		eyebrow: "Program analytics",
		title: "Training at a glance",
		description: `Progress signals for ${currentProgram?.name ?? "your selected program"}, calculated from recorded workout history.`,
		isEmpty,
		emptyState: {
			title: "Your progress story starts here",
			message:
				"Finish a scheduled workout and record its sets to unlock activity, adherence, and workload insights.",
		},
		primaryMetric: {
			label: "Program adherence",
			value: completionPercentage === null ? "—" : `${completionPercentage}%`,
			context:
				scheduledCount === 0
					? "No sessions are scheduled inside this program yet."
					: `${formatNumber(finishedScheduledCount)} of ${formatNumber(scheduledCount)} scheduled sessions finished${cancelledCount > 0 ? ` · ${formatNumber(cancelledCount)} cancelled` : ""}.`,
		},
		metrics: [
			{
				label: "Finished workouts",
				value: formatNumber(finishedActivityCount),
				context: "Attributed to actual completion date",
			},
			{
				label: "Active days",
				value: formatNumber(activeDayCount),
				context: "Days with at least one finished workout",
			},
			{
				label: "Performed steps",
				value: formatNumber(analytics.performedWork.performedStepCount),
				context: "Exercises recorded as performed",
			},
		],
	};
}
