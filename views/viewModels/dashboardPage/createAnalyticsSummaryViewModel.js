import {
	formatLocaleNumber,
	formatLocalePercent,
} from "../../../src/infrastructure/i18n/formatLocale.js";
import createViewModelTranslator, { translateCount } from "../translate.js";

/** @param {import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData} input @param {Function} [translate] */
export default function createAnalyticsSummaryViewModel(
	{ currentProgram, analytics },
	translate,
	language = "en",
) {
	const t = createViewModelTranslator(translate);
	const formatNumber = (value) => formatLocaleNumber(value, language);
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
		eyebrow: t("dashboard.analyticsEyebrow", { defaultValue: "Program analytics" }),
		title: t("dashboard.analyticsTitle", { defaultValue: "Training at a glance" }),
		description: t("dashboard.analyticsDescription", {
			program: currentProgram?.name ?? "your selected program",
			defaultValue:
				"Progress signals for {{program}}, calculated from recorded workout history.",
		}),
		isEmpty,
		emptyState: {
			title: t("dashboard.progressStoryTitle", {
				defaultValue: "Your progress story starts here",
			}),
			message: t("dashboard.progressStoryMessage", {
				defaultValue:
					"Finish a scheduled workout and record its sets to unlock activity, adherence, and workload insights.",
			}),
		},
		primaryMetric: {
			label: t("dashboard.programAdherence", { defaultValue: "Program adherence" }),
			value:
				completionPercentage === null
					? "—"
					: formatLocalePercent(completionPercentage, language),
			context:
				scheduledCount === 0
					? t("dashboard.noScheduledSessions", {
							defaultValue: "No sessions are scheduled inside this program yet.",
						})
					: t("dashboard.adherenceSummary", {
							finished: formatNumber(finishedScheduledCount),
							scheduled: formatNumber(scheduledCount),
							scheduledLabel: translateCount(
								translate,
								"dashboard.scheduledSession",
								scheduledCount,
								{ one: "scheduled session", other: "scheduled sessions" },
							),
							cancelled:
								cancelledCount > 0
									? t("dashboard.cancelledSummary", {
											count: formatNumber(cancelledCount),
											defaultValue: " · {{count}} cancelled",
										})
									: "",
							defaultValue:
								"{{finished}} of {{scheduled}} {{scheduledLabel}} finished{{cancelled}}.",
						}),
		},
		metrics: [
			{
				label: t("dashboard.finishedWorkouts", { defaultValue: "Finished workouts" }),
				value: formatNumber(finishedActivityCount),
				context: t("dashboard.completionDateContext", {
					defaultValue: "Attributed to actual completion date",
				}),
			},
			{
				label: t("dashboard.activeDays", { defaultValue: "Active days" }),
				value: formatNumber(activeDayCount),
				context: t("dashboard.activeDaysContext", {
					defaultValue: "Days with at least one finished workout",
				}),
			},
			{
				label: t("dashboard.performedSteps", { defaultValue: "Performed steps" }),
				value: formatNumber(analytics.performedWork.performedStepCount),
				context: t("dashboard.performedStepsContext", {
					defaultValue: "Exercises recorded as performed",
				}),
			},
		],
	};
}
