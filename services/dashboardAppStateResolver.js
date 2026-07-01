async function getAppState({ workoutSessionId, data }) {
	const { user, program, trainingDay, workoutSessionArrByTrainingDay } = data;

	const workoutSession = workoutSessionId
		? workoutSessionArrByTrainingDay.find(ws => ws.id === workoutSessionId)
		: workoutSessionArrByTrainingDay?.[0] || null;

	return {
		user,
		program,
		trainingDay,
		workoutSession,
	};
}

export { getAppState };
