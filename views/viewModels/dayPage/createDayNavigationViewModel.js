import formatDayPageDate from "./formatDayPageDate.js";
import createViewModelTranslator from "../translate.js";

/**
 * @typedef {import("../../../src/features/trainingDays/trainingDays.types.js").TrainingDay} TrainingDay
 * @param {{currentDay: TrainingDay | null, days: TrainingDay[], programName?: string | null, cycleName?: string | null, language?: string, translate?: Function}} input
 */
export default function createDayNavigationViewModel({
	currentDay,
	days,
	programName = null,
	cycleName = null,
	language = "en",
	translate,
}) {
	const t = createViewModelTranslator(translate);
	const currentIndex = currentDay
		? days.findIndex((day) => day.id === currentDay.id)
		: -1;

	/** @param {TrainingDay | undefined} day */
	const toLink = (day) =>
		day
			? {
					id: day.id,
					label:
						formatDayPageDate(day.scheduledDate, language) ??
						t("dashboard.datePending", { defaultValue: "Date pending" }),
					name:
						day.label?.trim() ||
						t("dashboard.dayNumber", {
							count: day.dayOrder,
							defaultValue: "Day {{count}}",
						}),
					contextLabel: t("dashboard.cycleDay", {
						cycle: day.cycleOrder,
						day: day.dayOrder,
						defaultValue: "Cycle {{cycle}} · Day {{day}}",
					}),
					href: `/programs/day?dayId=${day.id}`,
				}
			: null;

	return {
		isVisible: days.length > 0,
		heading: programName
			? t("programs.programTrainingDays", {
					name: programName,
					defaultValue: "{{name}} training days",
				})
			: t("dashboard.chooseTrainingDay", { defaultValue: "Choose a training day" }),
		description: cycleName
			? t("dashboard.selectedDayDescription", {
					name: cycleName,
					defaultValue:
						"{{name}} contains the selected day. You can also open another day in this program.",
				})
			: t("dashboard.otherDayDescription", {
					defaultValue: "Open another scheduled day in this program.",
				}),
		previous: currentIndex > 0 ? toLink(days[currentIndex - 1]) : null,
		next:
			currentIndex >= 0 && currentIndex < days.length - 1
				? toLink(days[currentIndex + 1])
				: null,
		items: days.map((day) => ({
			...toLink(day),
			isCurrent: day.id === currentDay?.id,
		})),
	};
}
