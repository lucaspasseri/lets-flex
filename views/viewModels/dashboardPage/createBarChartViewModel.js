import { parseISO } from "date-fns";
import createViewModelTranslator from "../translate.js";

/** @param {Pick<import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData, "currentProgram" | "analytics">} input @param {Function} [translate] */
export default function createBarChartViewModel(
	{ currentProgram, analytics },
	translate,
	language = "en",
) {
	const t = createViewModelTranslator(translate);
	const dateFormatter = new Intl.DateTimeFormat(language, {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
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
			weekLabel: t("dashboard.weekLabel", {
				count: week.weekIndex + 1,
				defaultValue: "Week {{count}}",
			}),
			shortLabel: `W${week.weekIndex + 1}`,
			rangeLabel: `${dateFormatter.format(startDate)}–${dateFormatter.format(endDate)}`,
			scheduledCount: week.scheduledCount,
			finishedCount: week.finishedCount,
			cancelledCount: week.cancelledCount,
			remainingCount: week.plannedCount + week.inProgressCount,
			completionLabel:
				completionPercentage === null
					? t("dashboard.noSessionsScheduled", {
							defaultValue: "No sessions scheduled",
						})
					: t("dashboard.completionLabel", {
							count: completionPercentage,
							defaultValue: "{{count}}% complete",
						}),
		};
	});

	return {
		isVisible: Boolean(currentProgram),
		isEmpty: scheduledCount === 0,
		showChart: scheduledCount > 0,
		headingId: "adherence-heading",
		descriptionId: "adherence-description",
		eyebrow: t("dashboard.followThrough", { defaultValue: "Follow-through" }),
		title: t("dashboard.scheduledAdherence", { defaultValue: "Scheduled adherence" }),
		description: t("dashboard.adherenceDescription", {
			defaultValue:
				"Finished sessions stay in their scheduled program week. Cancelled sessions remain visible and never count as finished.",
		}),
		summary:
			completionPercentage === null
				? t("dashboard.noScheduledSessions", {
						defaultValue: "No sessions are scheduled inside this program calendar yet.",
					})
				: t("dashboard.adherenceSummaryCompact", {
						percentage: completionPercentage,
						finished: finishedCount,
						cancelled: cancelledCount,
						defaultValue:
							"{{percentage}}% complete · {{finished}} finished · {{cancelled}} cancelled",
					}),
		emptyState: {
			title: t("dashboard.noAdherenceData", { defaultValue: "No adherence data yet" }),
			message: t("dashboard.adherenceMessage", {
				defaultValue:
					"Schedule sessions in this program to compare planned and finished training by week.",
			}),
		},
		legend: [
			{
				label: t("dashboard.scheduled", { defaultValue: "Scheduled" }),
				modifier: "scheduled",
			},
			{
				label: t("dashboard.finished", { defaultValue: "Finished" }),
				modifier: "finished",
			},
			{
				label: t("dashboard.cancelled", { defaultValue: "Cancelled" }),
				modifier: "cancelled",
			},
		],
		labels: rows.map((week) => week.shortLabel),
		scheduledCounts: rows.map((week) => week.scheduledCount),
		finishedCounts: rows.map((week) => week.finishedCount),
		cancelledCounts: rows.map((week) => week.cancelledCount),
		rows,
	};
}
