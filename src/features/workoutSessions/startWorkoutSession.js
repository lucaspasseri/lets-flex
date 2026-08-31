import pool from "../../../db/pool.js";
import * as workoutSessionsRepository from "./repository.js";
import * as workoutSessionStepLogsRepository from "../workoutSessionStepLogs/repository.js";
import ResourceNotFoundError from "../shared/ResourceNotFoundError.js";

async function startWorkoutSession({ workoutSessionId, userId }) {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const workoutSession =
			workoutSessionId &&
			(await workoutSessionsRepository.findByIdForUser(
				{
					workoutSessionId,
					userId,
				},
				client,
			));

		if (!workoutSession) {
			throw new ResourceNotFoundError();
		}

		if (workoutSession.status !== "planned") {
			throw new Error("Only planned workout sessions can be started");
		}

		const updatedWorkoutSession = await workoutSessionsRepository.startByIdForUser(
			{
				workoutSessionId,
				userId,
			},
			client,
		);

		const workoutStepLogs = await workoutSessionStepLogsRepository.createBySessionSteps(
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
