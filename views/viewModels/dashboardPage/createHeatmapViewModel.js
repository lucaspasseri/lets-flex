import createViewModelTranslator from "../translate.js";
import {
	formatLocaleDate,
	formatLocaleNumber,
} from "../../../src/infrastructure/i18n/formatLocale.js";

/** @param {Pick<import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData, "currentProgram" | "heatmap">} input @param {Function} [translate] */
export default function createHeatmapViewModel(
	{ currentProgram, heatmap },
	translate,
	language = "en",
) {
	const t = createViewModelTranslator(translate);
	const days = heatmap.flatMap((cycle) =>
		cycle.days.map((day) => ({ ...day, cycleName: cycle.cycleName })),
	);
	const finishedCount = days.reduce((sum, day) => sum + day.finishedCount, 0);
	const activeDays = days.filter((day) => day.finishedCount > 0);
	const formatCount = (count) => formatLocaleNumber(count, language);

	return {
		isVisible: Boolean(currentProgram),
		isEmpty: finishedCount === 0,
		headingId: "activity-heading",
		descriptionId: "activity-description",
		eyebrow: t("dashboard.consistency", { defaultValue: "Consistency" }),
		title: t("dashboard.workoutActivity", { defaultValue: "Workout activity" }),
		description: t("dashboard.activityDescription", {
			defaultValue:
				"Finished workouts are placed on their actual completion date within the scheduled program calendar.",
		}),
		summary:
			finishedCount === 0
				? t("dashboard.noFinishedWorkoutsInCalendar", {
						defaultValue: "No finished workouts fall inside this program calendar yet.",
					})
				: t("dashboard.activitySummary", {
						finished: formatCount(finishedCount),
						workouts: t("dashboard.finishedWorkout", {
							count: finishedCount,
							defaultValue: "workouts",
						}),
						active: formatCount(activeDays.length),
						days: t("dashboard.activeDay", {
							count: activeDays.length,
							defaultValue: "days",
						}),
						defaultValue:
							"{{finished}} finished {{workouts}} across {{active}} active {{days}}.",
					}),
		emptyState: {
			title: t("dashboard.noActivity", {
				defaultValue: "No activity in this calendar yet",
			}),
			message: t("dashboard.activityMessage", {
				defaultValue:
					"Finished workouts will appear here on the date you complete them.",
			}),
		},
		weekdays: Array.from({ length: 7 }, (_, index) =>
			formatLocaleDate(new Date(Date.UTC(2023, 0, index + 1)), language, {
				weekday: "short",
			}),
		),
		legend: [
			{
				label: t("dashboard.noFinishedWorkouts", {
					defaultValue: "No finished workouts",
				}),
				modifier: "none",
				marker: "—",
			},
			{
				label: t("dashboard.oneFinishedWorkout", {
					defaultValue: "One finished workout",
				}),
				modifier: "one",
				marker: "1",
			},
			{
				label: t("dashboard.manyFinishedWorkouts", {
					defaultValue: "Two or more finished workouts",
				}),
				modifier: "many",
				marker: "2+",
			},
		],
		cycles: heatmap.map((cycle) => ({
			id: cycle.cycleId,
			name: cycle.cycleName,
			finishedCount: cycle.days.reduce((sum, day) => sum + day.finishedCount, 0),
			finishedCountLabel: t("dashboard.finishedWorkoutsOnDate", {
				count: cycle.days.reduce((sum, day) => sum + day.finishedCount, 0),
				formattedCount: formatCount(
					cycle.days.reduce((sum, day) => sum + day.finishedCount, 0),
				),
				defaultValue: "{{formattedCount}} finished workouts",
			}),
			days: cycle.days.map((day) => ({
				...day,
				dayLabel: formatLocaleDate(day.date, language, { day: "numeric" }),
				marker: day.finishedCount === 0 ? "—" : formatCount(day.finishedCount),
				accessibleLabel: `${formatLocaleDate(day.date, language, { dateStyle: "full" })}: ${day.finishedCount === 0 ? t("dashboard.noFinishedWorkoutsOnDate", { defaultValue: "no finished workouts" }) : t("dashboard.finishedWorkoutsOnDate", { count: day.finishedCount, formattedCount: formatCount(day.finishedCount), defaultValue: "{{formattedCount}} finished workouts" })}`,
				emptyCells: Array.from({ length: day.offset ?? 0 }, (_, index) => index),
				cellClass: `dashboard-heatmap__cell--${day.intensity}`,
			})),
		})),
		activityRows: activeDays.map((day) => ({
			dateKey: day.dateKey,
			dateLabel: formatLocaleDate(day.date, language, {
				month: "short",
				day: "numeric",
				year: "numeric",
			}),
			cycleName: day.cycleName,
			finishedCount: day.finishedCount,
			finishedCountLabel: formatCount(day.finishedCount),
		})),
	};
}
