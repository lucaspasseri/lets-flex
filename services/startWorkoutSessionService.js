import pool from "../db/pool.js";
import toNullableNumber from "../utils/toNullableNumber.js";
import * as workoutSessionsDb from "../db/workout_sessions/index.js";
import * as sessionsDb from "../db/sessions/index.js";
import * as sessionStepsDb from "../db/session_steps/index.js";
import * as workoutStepLogsDb from "../db/workout_step_logs/index.js";

async function startWorkoutSessionService({ sessionId }) {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const session = await sessionsDb.getSessionById(client, { sessionId });

		if (!session) {
			throw new Error(`Session with ID ${sessionId} was not found`);
		}

		const workoutSession = await workoutSessionsDb.insertWorkoutSession(
			client,
			{
				sessionId,
			},
		);

		const sessionStepArr = await sessionStepsDb.getSessionStepsBySessionId(
			client,
			{ sessionId },
		);

		const workoutStepLogArr =
			await workoutStepLogsDb.insertWorkoutStepLogBySessionIdAndWorkoutSessionId(
				client,
				{
					sessionId,
					workoutSessionId: workoutSession.id,
				},
			);

		await client.query("COMMIT");
		return workoutSession;
	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

export default startWorkoutSessionService;
