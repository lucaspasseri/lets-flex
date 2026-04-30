import pool from "../pool.js";

async function getAllSessions() {
	const { rows } = await pool.query("SELECT * FROM sessions");
	return rows;
}

async function getSessionByTrainingDayId(db, { trainingDayId }) {
	if (trainingDayId === null) return [];

	const { rows } = await pool.query(
		"SELECT * FROM sessions WHERE training_day_id = $1 ORDER BY session_order",
		[trainingDayId],
	);
	return rows;
}

async function getAllSessionsWithOutIds() {
	const { rows: sessions } = await pool.query(
		"SELECT sessions.id, cycles.name AS cycle_name, sessions.name AS session_name, sessions.session_order AS session_order FROM sessions JOIN cycles ON sessions.cycle_id = cycles.id",
	);

	return sessions;
}
async function insertSession(db, { cycleId, name, sessionOrder }) {
	const { rows } = await db.query(
		"INSERT INTO sessions (name, cycle_id, session_order) VALUES ($1, $2, $3) RETURNING *",
		[name, cycleId, sessionOrder],
	);

	return rows[0];
}

async function postNewSession(name, trainingDayId, sessionOrder) {
	const client = await pool.connect();

	const numericTrainingDayId = Number(trainingDayId);
	const numericSessionOrder = Number(sessionOrder);

	try {
		await client.query("BEGIN");

		const { rows: trainingDays } = await client.query(
			"SELECT id FROM training_days WHERE id = $1",
			[numericTrainingDayId],
		);

		if (trainingDays.length === 0) {
			throw new Error(
				`Training day with ID ${numericTrainingDayId} was not found`,
			);
		}

		const { rows: sessionCountRows } = await client.query(
			"SELECT COUNT(*) FROM sessions WHERE training_day_id = $1",
			[numericTrainingDayId],
		);

		const numberOfSessions = Number(sessionCountRows[0].count);

		if (
			!Number.isInteger(numericSessionOrder) ||
			numericSessionOrder < 1 ||
			numericSessionOrder > numberOfSessions + 1
		) {
			throw new Error(
				`Session order must be between 1 and ${numberOfSessions + 1}`,
			);
		}

		await client.query(
			`
			UPDATE sessions
			SET session_order = session_order + 1
			WHERE training_day_id = $1
			  AND session_order >= $2
			`,
			[numericTrainingDayId, numericSessionOrder],
		);

		const { rows } = await client.query(
			`
			INSERT INTO sessions (name, training_day_id, session_order)
			VALUES ($1, $2, $3)
			RETURNING *
			`,
			[name, numericTrainingDayId, numericSessionOrder],
		);

		await client.query("COMMIT");

		return rows[0];
	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

export {
	getAllSessions,
	getSessionByTrainingDayId,
	getAllSessionsWithOutIds,
	postNewSession,
	insertSession,
};
