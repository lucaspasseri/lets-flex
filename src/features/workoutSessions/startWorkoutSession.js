import pool from "../../../db/pool.js";
import * as workoutSessionsRepository from "./repository.js";
import * as workoutSessionStepLogsRepository from "../workoutSessionStepLogs/repository.js";
import ResourceNotFoundError from "../shared/ResourceNotFoundError.js";
import WorkoutSessionLifecycleError from "./WorkoutSessionLifecycleError.js";

function isActiveSessionConflict(error) {
	return (
		error &&
		typeof error === "object" &&
		"code" in error &&
		error.code === "23505" &&
		"constraint" in error &&
		error.constraint === "one_active_workout_session_per_training_day"
	);
}

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
			throw new WorkoutSessionLifecycleError("start");
		}

		const updatedWorkoutSession = await workoutSessionsRepository.startByIdForUser(
			{
				workoutSessionId,
				userId,
			},
			client,
		);
		if (!updatedWorkoutSession) {
			throw new WorkoutSessionLifecycleError("start");
		}

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
		if (isActiveSessionConflict(err)) {
			throw new WorkoutSessionLifecycleError("start", "active_session");
		}
		throw err;
	} finally {
		client.release();
	}
}

export default startWorkoutSession;
