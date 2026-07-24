import * as workoutSessionStepLogsRepository from "./repository.js";

async function skipWorkoutStepLog({ workoutStepLogId, status }) {
	const workoutStepLog = await workoutSessionStepLogsRepository.updateById({
		workoutStepLogId,
		status,
	});

	return workoutStepLog;
}

export default skipWorkoutStepLog;
