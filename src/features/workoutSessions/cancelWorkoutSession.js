import * as workoutSessionsRepository from "./repository.js";
import ResourceNotFoundError from "../shared/ResourceNotFoundError.js";
import WorkoutSessionLifecycleError from "./WorkoutSessionLifecycleError.js";

async function cancelWorkoutSession({ workoutSessionId, userId }) {
	const existingWorkoutSession =
		workoutSessionId &&
		(await workoutSessionsRepository.findByIdForUser({ workoutSessionId, userId }));
	if (!existingWorkoutSession) throw new ResourceNotFoundError();
	if (existingWorkoutSession.status !== "planned") {
		throw new WorkoutSessionLifecycleError("cancel");
	}

	const workout = await workoutSessionsRepository.cancelByIdForUser({
		workoutSessionId,
		userId,
	});
	if (!workout) throw new WorkoutSessionLifecycleError("cancel");
}

export default cancelWorkoutSession;
