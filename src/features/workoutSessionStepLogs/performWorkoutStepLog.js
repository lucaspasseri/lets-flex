import pool from "../../../db/pool.js";
import * as workoutSessionStepLogsRepository from "./repository.js";
import * as workoutSessionSetLogsRepository from "../workoutSessionSetLogs/repository.js";
import ResourceNotFoundError from "../shared/ResourceNotFoundError.js";
import WorkoutStepLogLifecycleError from "./WorkoutStepLogLifecycleError.js";

async function performWorkoutStepLog({ workoutStepLogId, logFormRows, userId }) {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");
		const existingWorkoutStepLog =
			workoutStepLogId &&
			(await workoutSessionStepLogsRepository.findByIdForUser(
				{ workoutStepLogId, userId },
				client,
			));
		if (!existingWorkoutStepLog) throw new ResourceNotFoundError();
		if (
			existingWorkoutStepLog.status !== "planned" ||
			existingWorkoutStepLog.workout_session_status !== "in_progress"
		) {
			throw new WorkoutStepLogLifecycleError("perform");
		}

		const workoutStepLog = await workoutSessionStepLogsRepository.updateByIdForUser(
			{
				workoutStepLogId,
				status: "performed",
				userId,
			},
			client,
		);
		if (!workoutStepLog) throw new WorkoutStepLogLifecycleError("perform");

		for (const [index, formRow] of logFormRows.entries()) {
			const { performedReps, performedLoadValue, performedLoadUnit } = formRow;

			await workoutSessionSetLogsRepository.create(
				{
					workoutStepLogId: workoutStepLog.id,
					setOrder: index + 1,
					reps: performedReps,
					loadValue: performedLoadValue,
					loadUnit: performedLoadUnit,
				},
				client,
			);
		}

		await client.query("COMMIT");
		return workoutStepLog;
	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

export default performWorkoutStepLog;
