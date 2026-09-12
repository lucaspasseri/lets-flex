import formatProgramsPageDate from "./formatProgramsPageDate.js";
import createDayViewTransitionName from "../shared/createDayViewTransitionName.js";
import createSessionStatusMarkersViewModel from "../shared/createSessionStatusMarkersViewModel.js";
import createViewModelTranslator from "../translate.js";

/**
 * @typedef {import("../../../src/features/programs/programs.types.js").Program} Program
 * @typedef {import("../../../src/features/cycles/cycles.types.js").Cycle} Cycle
 * @typedef {import("../../../src/features/trainingDays/trainingDays.types.js").TrainingDay} TrainingDay
 * @typedef {import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession} WorkoutSession
 */

/**
 * @param {{currentProgram: Program | null, currentCycle: Cycle | null, trainingDays: TrainingDay[], workoutSessions: WorkoutSession[], translate?: Function, language?: string}} input
 */
export default function createCalendarNavigationViewModel({
	currentProgram,
	currentCycle,
	trainingDays,
	workoutSessions,
	translate,
	language = "en",
}) {
	const t = createViewModelTranslator(translate);
	return {
		id: "program-calendar",
		isVisible: currentProgram !== null,
		eyebrow: t("programs.levelTrainingDays", {
			defaultValue: "Level 3 · Training days",
		}),
		heading: currentProgram
			? t("programs.programTrainingDays", {
					name: currentProgram.name,
					defaultValue: "{{name}} training days",
				})
			: t("dashboard.trainingDays", { defaultValue: "Training days" }),
		description: currentCycle
			? t("programs.selectedCycleDescription", {
					name: currentCycle.name,
					defaultValue:
						"{{name}} is selected. Its days are highlighted in the full program calendar; open one to manage assigned sessions.",
				})
			: t("programs.chooseCycleDescription", {
					defaultValue:
						"Choose a cycle above to highlight its days, then open a day to manage assigned sessions.",
				}),
		items: trainingDays.map((day, index) => {
			const isInCurrentCycle = day.cycleId === currentCycle?.id;
			const statusMarkers = createSessionStatusMarkersViewModel(
				workoutSessions.filter((session) => session.trainingDayId === day.id),
				translate,
			);

			return {
				id: day.id,
				viewTransitionName: createDayViewTransitionName(day.id),
				label:
					day.label ??
					t("dashboard.dayNumber", {
						count: day.dayOrder,
						defaultValue: "Day {{count}}",
					}),
				dateLabel:
					formatProgramsPageDate(day.scheduledDate, language) ??
					t("dashboard.dateNotScheduled", { defaultValue: "Date not scheduled" }),
				href: `/programs/day?dayId=${day.id}`,
				cycleId: day.cycleId,
				cycleOrder: day.cycleOrder,
				isFirst: index === 0,
				isInCurrentCycle,
				statusMarkers,
				className: [
					"calendar-navigation__item",
					index === 0 && "calendar-navigation__item--first",
					isInCurrentCycle && "calendar-navigation__item--current-cycle",
				]
					.filter(Boolean)
					.join(" "),
				accessibleLabel: t("programs.openTrainingDay", {
					name:
						day.label ??
						t("dashboard.dayNumber", {
							count: day.dayOrder,
							defaultValue: "Day {{count}}",
						}),
					date:
						formatProgramsPageDate(day.scheduledDate, language) ??
						t("dashboard.dateNotScheduled", { defaultValue: "Date not scheduled" }),
					status: statusMarkers.accessibleLabel,
					defaultValue: "Open {{name}}, {{date}}. {{status}}",
				}),
			};
		}),
		emptyState: {
			title: t("programs.noTrainingDays", { defaultValue: "No training days yet" }),
			description: t("programs.noTrainingDaysDescription", {
				defaultValue:
					"Create a cycle above to generate its ordered, scheduled training days.",
			}),
		},
	};
}
