/**
 * @param {{workoutSessionId: number | null, trainingDay: import("../trainingDays/trainingDays.types.js").TrainingDay | null, cycles: import("../cycles/cycles.types.js").Cycle[], workoutSessions: import("../workoutSessions/workoutSessions.types.js").WorkoutSession[]}} input
 */
export default function resolveDashboardSelection({
	workoutSessionId,
	trainingDay,
	cycles,
	workoutSessions,
}) {
	const currentDayWorkoutSessions = trainingDay
		? workoutSessions.filter((session) => session.trainingDayId === trainingDay.id)
		: [];
	const selectedWorkoutSession =
		currentDayWorkoutSessions.find((session) => session.id === workoutSessionId) ??
		currentDayWorkoutSessions[0] ??
		null;

	return {
		currentCycle: cycles.find((cycle) => cycle.id === trainingDay?.cycleId) ?? null,
		currentDayWorkoutSessions,
		selectedWorkoutSession,
	};
}
