import createViewModelTranslator, { translateCount } from "../translate.js";

/**
 * @typedef {import("../../../src/features/programs/programs.types.js").Program} Program
 * @typedef {import("../../../src/features/cycles/cycles.types.js").Cycle} Cycle
 * @typedef {import("../../../src/features/trainingDays/trainingDays.types.js").TrainingDay} TrainingDay
 * @typedef {import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession} WorkoutSession
 */

/**
 * @param {{currentProgram: Program | null, currentCycle: Cycle | null, trainingDays: TrainingDay[], workoutSessions: WorkoutSession[], translate?: Function}} input
 */
export default function createHierarchyGuideViewModel({
	currentProgram,
	currentCycle,
	trainingDays,
	workoutSessions,
	translate,
}) {
	const t = createViewModelTranslator(translate);
	const selectedCycleDays = currentCycle
		? trainingDays.filter((day) => day.cycleId === currentCycle.id)
		: [];
	const selectedDayIds = new Set(selectedCycleDays.map((day) => day.id));
	const assignedSessionCount = workoutSessions.filter(
		(session) =>
			selectedDayIds.has(session.trainingDayId) && session.status !== "cancelled",
	).length;

	return {
		id: "program-hierarchy",
		heading: t("programs.hierarchyHeading", {
			defaultValue: "Plan your workout from goal to session",
		}),
		description: t("programs.hierarchyDescription", {
			defaultValue:
				"Choose a program, select its cycle, open a training day, then assign a session.",
		}),
		items: [
			{
				levelLabel: t("programs.levelStart", { defaultValue: "Level 1 · Start here" }),
				name: t("programs.program", { defaultValue: "Program" }),
				description: t("programs.programDescription", {
					defaultValue: "Set the overall goal and schedule.",
				}),
				icon: "layers",
				stateLabel:
					currentProgram?.name ??
					t("programs.chooseOrCreateProgram", {
						defaultValue: "Choose or create a program",
					}),
				isSelected: currentProgram !== null,
			},
			{
				levelLabel: t("programs.levelCycle", {
					defaultValue: "Level 2 · Choose a cycle",
				}),
				name: t("programs.cycle", { defaultValue: "Cycle" }),
				description: t("programs.cycleDescription", {
					defaultValue: "Organize the plan into a focused block.",
				}),
				icon: "repeat-2",
				stateLabel:
					currentCycle?.name ??
					(currentProgram
						? t("programs.chooseOrCreateCycle", {
								defaultValue: "Choose or create a cycle",
							})
						: t("programs.availableAfterProgram", {
								defaultValue: "Available after a program",
							})),
				isSelected: currentCycle !== null,
			},
			{
				levelLabel: t("programs.levelTrainingDay", {
					defaultValue: "Level 3 · Open a training day",
				}),
				name: t("programs.trainingDay", { defaultValue: "Training day" }),
				description: t("programs.trainingDayDescription", {
					defaultValue: "Open a scheduled day to assign its workout.",
				}),
				icon: "calendar-range",
				stateLabel: currentCycle
					? translateCount(
							translate,
							"programs.hierarchyDays",
							selectedCycleDays.length,
							{
								one: "{{count}} day in selected cycle",
								other: "{{count}} days in selected cycle",
							},
						)
					: currentProgram
						? t("programs.chooseCycleToHighlight", {
								defaultValue: "Choose a cycle to highlight its days",
							})
						: t("programs.availableAfterCycle", {
								defaultValue: "Available after a cycle",
							}),
				isSelected: currentCycle !== null,
			},
			{
				levelLabel: t("programs.levelSession", {
					defaultValue: "Level 4 · Assign a session",
				}),
				name: t("programs.session", { defaultValue: "Session" }),
				description: t("programs.sessionDescription", {
					defaultValue: "Choose the reusable workout template for the day.",
				}),
				icon: "dumbbell",
				stateLabel: currentCycle
					? translateCount(
							translate,
							"programs.hierarchySessions",
							assignedSessionCount,
							{
								one: "{{count}} assigned session in selected cycle",
								other: "{{count}} assigned sessions in selected cycle",
							},
						)
					: t("programs.availableAfterTrainingDay", {
							defaultValue: "Available after a training day",
						}),
				isSelected: assignedSessionCount > 0,
			},
		],
	};
}
