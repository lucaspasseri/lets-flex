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
		heading: "How your training plan fits together",
		description:
			"Start with a program, then move through each level to plan a workout.",
		items: [
			{
				levelLabel: "Level 1",
				name: "Program",
				description: "Your overall training plan and goal.",
				icon: "layers",
				stateLabel: currentProgram?.name ?? "Choose or create a program",
				isSelected: currentProgram !== null,
			},
			{
				levelLabel: "Level 2",
				name: "Cycle",
				description: "A focused block inside the program.",
				icon: "repeat-2",
				stateLabel:
					currentCycle?.name ??
					(currentProgram ? "Choose or create a cycle" : "Available after a program"),
				isSelected: currentCycle !== null,
			},
			{
				levelLabel: "Level 3",
				name: "Training day",
				description: "A scheduled day within a cycle.",
				icon: "calendar-range",
				stateLabel: currentCycle
					? formatCount(selectedCycleDays.length, "day", "days", "in selected cycle")
					: currentProgram
						? "Choose a cycle to highlight its days"
						: "Available after a cycle",
				isSelected: currentCycle !== null,
			},
			{
				levelLabel: "Level 4",
				name: "Session",
				description: "The workout assigned to a training day.",
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
