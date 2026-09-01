import * as workoutSessionStepLogsRepository from "./repository.js";
import ResourceNotFoundError from "../shared/ResourceNotFoundError.js";

async function skipWorkoutStepLog({ workoutStepLogId, status, userId }) {
	const workoutStepLog = await workoutSessionStepLogsRepository.updateByIdForUser({
		workoutStepLogId,
		status,
		userId,
	});
	if (!workoutStepLog) throw new ResourceNotFoundError();

	return workoutStepLog;
}

export default skipWorkoutStepLog;
