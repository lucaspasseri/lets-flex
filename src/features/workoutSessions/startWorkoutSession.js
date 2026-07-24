import pool from "../../../db/pool.js";
import * as workoutSessionsRepository from "./repository.js";
import * as workoutSessionStepLogsRepository from "../workoutSessionStepLogs/repository.js";

async function startWorkoutSession({ workoutSessionId }) {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const workoutSession =
			workoutSessionId &&
			(await workoutSessionsRepository.findById(
				{
					workoutSessionId,
				},
				client,
			));

		if (!workoutSession) {
			throw new Error("Workout session not found");
		}

		if (workoutSession.status !== "planned") {
			throw new Error("Only planned workout sessions can be started");
		}

		const updatedWorkoutSession = await workoutSessionsRepository.startById(
			{
				workoutSessionId,
			},
			client,
		);

		const workoutStepLogs =
			await workoutSessionStepLogsRepository.createBySessionSteps(
				{
					workoutSessionId,
					sessionId: updatedWorkoutSession.session_id,
				},
				client,
			);

		await client.query("COMMIT");

		return {
			workoutSession: updatedWorkoutSession,
			workoutStepLogs,
		};
	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

export default startWorkoutSession;
