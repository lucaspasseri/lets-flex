import pool from "../db/pool.js";
import {
	getWorkoutSessionById,
	startWorkoutSession,
} from "../db/workout_sessions/index.js";
import { insertWorkoutStepLogsFromSessionSteps } from "../db/workout_step_logs/index.js";

async function startWorkoutSessionService(pool, { workoutSessionId }) {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const workoutSession =
			workoutSessionId &&
			(await getWorkoutSessionById(client, {
				workoutSessionId,
			}));

		console.log({ workoutSession });

		if (!workoutSession) {
			throw new Error("Workout session not found");
		}

		if (workoutSession.status !== "planned") {
			throw new Error("Only planned workout sessions can be started");
		}

		const updatedWorkoutSession = await startWorkoutSession(client, {
			workoutSessionId,
		});

		const workoutStepLogs = await insertWorkoutStepLogsFromSessionSteps(
			client,
			{
				workoutSessionId,
				sessionId: updatedWorkoutSession.session_id,
			},
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

export { startWorkoutSessionService };
