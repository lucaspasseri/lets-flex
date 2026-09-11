/**
 * @typedef {import("../../../src/features/programs/programs.types.js").Program} Program
 * @typedef {import("../../../src/features/cycles/cycles.types.js").Cycle} Cycle
 * @typedef {import("../../../src/features/trainingDays/trainingDays.types.js").TrainingDay} TrainingDay
 * @typedef {import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession} WorkoutSession
 */

/**
 * @param {{currentProgram: Program | null, currentCycle: Cycle | null, trainingDays: TrainingDay[], workoutSessions: WorkoutSession[]}} input
 */
export default function createHierarchyGuideViewModel({
	currentProgram,
	currentCycle,
	trainingDays,
	workoutSessions,
}) {
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
		heading: "Plan your workout from goal to session",
		description:
			"Choose a program, select its cycle, open a training day, then assign a session.",
		items: [
			{
				levelLabel: "Level 1 · Start here",
				name: "Program",
				description: "Set the overall goal and schedule.",
				icon: "layers",
				stateLabel: currentProgram?.name ?? "Choose or create a program",
				isSelected: currentProgram !== null,
			},
			{
				levelLabel: "Level 2 · Choose a cycle",
				name: "Cycle",
				description: "Organize the plan into a focused block.",
				icon: "repeat-2",
				stateLabel:
					currentCycle?.name ??
					(currentProgram ? "Choose or create a cycle" : "Available after a program"),
				isSelected: currentCycle !== null,
			},
			{
				levelLabel: "Level 3 · Open a training day",
				name: "Training day",
				description: "Open a scheduled day to assign its workout.",
				icon: "calendar-range",
				stateLabel: currentCycle
					? formatCount(selectedCycleDays.length, "day", "days", "in selected cycle")
					: currentProgram
						? "Choose a cycle to highlight its days"
						: "Available after a cycle",
				isSelected: currentCycle !== null,
			},
			{
				levelLabel: "Level 4 · Assign a session",
				name: "Session",
				description: "Choose the reusable workout template for the day.",
				icon: "dumbbell",
				stateLabel: currentCycle
					? formatCount(
							assignedSessionCount,
							"assigned session",
							"assigned sessions",
							"in selected cycle",
						)
					: "Available after a training day",
				isSelected: assignedSessionCount > 0,
			},
		],
	};
}

function formatCount(count, singular, plural, suffix) {
	return `${count} ${count === 1 ? singular : plural} ${suffix}`;
}
