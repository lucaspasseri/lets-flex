import * as workoutSessionStepLogsRepository from "./repository.js";
import ResourceNotFoundError from "../shared/ResourceNotFoundError.js";
import WorkoutStepLogLifecycleError from "./WorkoutStepLogLifecycleError.js";

async function skipWorkoutStepLog({ workoutStepLogId, userId }) {
	const existingWorkoutStepLog =
		workoutStepLogId &&
		(await workoutSessionStepLogsRepository.findByIdForUser({
			workoutStepLogId,
			userId,
		}));
	if (!existingWorkoutStepLog) throw new ResourceNotFoundError();
	if (
		existingWorkoutStepLog.status !== "planned" ||
		existingWorkoutStepLog.workout_session_status !== "in_progress"
	) {
		throw new WorkoutStepLogLifecycleError("skip");
	}

	const workoutStepLog = await workoutSessionStepLogsRepository.updateByIdForUser({
		workoutStepLogId,
		status: "skipped",
		userId,
	});
	if (!workoutStepLog) throw new WorkoutStepLogLifecycleError("skip");

	return workoutStepLog;
}

export default skipWorkoutStepLog;
