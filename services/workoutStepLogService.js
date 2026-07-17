import pool from "../db/pool.js";
import * as workoutStepLogsDb from "../db/workout_step_logs/index.js";
import * as workoutSetLogsDb from "../db/workout_set_logs/index.js";

async function skipWorkoutStep({ workoutStepLogId, status }) {
	const workoutStepLog = await workoutStepLogsDb.updateWorkoutStepLogStatus(
		pool,
		{
			workoutStepLogId,
			status,
		},
	);

	return { workoutStepLog };
}

async function performWorkoutStep({ workoutStepLogId, status, logFormRows }) {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const workoutStepLog = await workoutStepLogsDb.updateWorkoutStepLogStatus(
			client,
			{
				workoutStepLogId,
				status,
			},
		);

		for (const [index, formRow] of logFormRows.entries()) {
			const { performedReps, performedLoadValue, performedLoadUnit } = formRow;

			await workoutSetLogsDb.insertWorkoutSetLog(client, {
				workoutStepLogId: workoutStepLog.id,
				setOrder: index + 1,
				reps: performedReps,
				loadValue: performedLoadValue,
				loadUnit: performedLoadUnit,
			});
		}

		await client.query("COMMIT");
		return { workoutStepLog };
	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

export { skipWorkoutStep, performWorkoutStep };
