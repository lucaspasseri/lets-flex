import pool from "../db/pool.js";
import { getWorkoutSessionByTrainingDayId } from "../db/workout_sessions/index.js";
import * as workoutSessionsDb from "../db/workout_sessions/index.js";

async function insertWorkoutSessionWithOrder({ sessionId, trainingDayId }) {
	console.log({ sessionId, trainingDayId });

	try {
		const currRows = await getWorkoutSessionByTrainingDayId(pool, {
			trainingDayId,
		});

		let workoutSessionOrder = null;
		if (currRows === null) {
			workoutSessionOrder = 1;
		} else {
			workoutSessionOrder = currRows.length + 1;
		}
		console.log({ workoutSessionOrder });

		const {
			rows: [workoutSession],
		} = await workoutSessionsDb.insertWorkoutSession(pool, {
			sessionId,
			trainingDayId,
			workoutSessionOrder,
		});

		console.log({ workoutSession });
	} catch (err) {
		console.log(err);
	}
}

export default insertWorkoutSessionWithOrder;
