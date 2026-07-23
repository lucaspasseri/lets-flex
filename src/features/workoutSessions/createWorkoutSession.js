import * as workoutSessionsRepository from "./repository.js";

async function createWorkoutSession({ sessionId, trainingDayId }) {
	const rows = await workoutSessionsRepository.findAllByTrainingDayId({
		trainingDayId,
	});

	await workoutSessionsRepository.create({
		sessionId,
		trainingDayId,
		workoutSessionOrder: rows?.length ? rows.length + 1 : 1,
		notes: "",
	});
}

export default createWorkoutSession;
