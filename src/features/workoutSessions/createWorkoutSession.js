import * as workoutSessionsRepository from "./repository.js";
import ResourceNotFoundError from "../shared/ResourceNotFoundError.js";

async function createWorkoutSession({ sessionId, trainingDayId, userId }) {
	const workout = await workoutSessionsRepository.createForUser({
		sessionId,
		trainingDayId,
		userId,
		notes: "",
	});
	if (!workout) throw new ResourceNotFoundError();
	return workout;
}

export default createWorkoutSession;
