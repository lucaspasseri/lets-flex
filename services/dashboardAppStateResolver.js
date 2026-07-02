import { toSessionViewModel } from "../views/viewModels/toSessionViewModel.js";

async function getAppState({ workoutSessionId, data }) {
	const { user, program, trainingDay, workoutSessionArrByTrainingDay } = data;

	const workoutSession = workoutSessionId
		? workoutSessionArrByTrainingDay.find(ws => ws.id === workoutSessionId)
		: workoutSessionArrByTrainingDay?.[0] || null;

	const shapedWorkoutSession = workoutSession
		? toSessionViewModel(workoutSession, {
				type: "workout",
			})
		: null;

	const workoutSessionPerformedPercentage = shapedWorkoutSession
		? calculateWorkoutStepPerformedPercentage(shapedWorkoutSession.steps)
		: 0;

	return {
		user,
		program,
		trainingDay,
		workoutSession: shapedWorkoutSession,
		workoutSessionPerformedPercentage,
	};
}

export { getAppState };

const calculateWorkoutStepPerformedPercentage = workoutStepLogArr => {
	const totalSteps = workoutStepLogArr.length;
	const performedSteps = workoutStepLogArr.filter(
		step => step?.stepLog?.status === "performed",
	).length;

	return totalSteps > 0 ? (performedSteps / totalSteps) * 100 : 0;
};
