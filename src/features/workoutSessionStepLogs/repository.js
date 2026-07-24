import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

export async function createBySessionSteps(
	{ workoutSessionId, sessionId },
	db = pool,
) {
	const { rows } = await db.query(queries.createAll(), [
		workoutSessionId,
		sessionId,
	]);

	return rows;
}
