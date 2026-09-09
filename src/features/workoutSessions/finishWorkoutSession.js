import * as workoutSessionsRepository from "./repository.js";
import ResourceNotFoundError from "../shared/ResourceNotFoundError.js";
import WorkoutSessionLifecycleError from "./WorkoutSessionLifecycleError.js";

export async function finishWorkoutSession({ workoutSessionId, userId }) {
	const existingWorkoutSession =
		workoutSessionId &&
		(await workoutSessionsRepository.findByIdForUser({ workoutSessionId, userId }));
	if (!existingWorkoutSession) throw new ResourceNotFoundError();
	if (existingWorkoutSession.status !== "in_progress") {
		throw new WorkoutSessionLifecycleError("finish");
	}

	const workoutSession = await workoutSessionsRepository.finishByIdForUser({
		workoutSessionId,
		userId,
	});
	if (!workoutSession) {
		throw new WorkoutSessionLifecycleError("finish", "unresolved_steps");
	}

	return workoutSession;
}
