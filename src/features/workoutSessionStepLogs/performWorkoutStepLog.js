import pool from "../../../db/pool.js";
import * as workoutSessionStepLogsRepository from "./repository.js";
import * as workoutSessionSetLogsRepository from "../workoutSessionSetLogs/repository.js";

async function performWorkoutStepLog({ workoutStepLogId, status, logFormRows }) {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const workoutStepLog = await workoutSessionStepLogsRepository.updateById(
			{
				workoutStepLogId,
				status,
			},
			client,
		);

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
