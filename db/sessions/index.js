import pool from "../pool.js";

async function getAllSessions() {
	const { rows } = await pool.query("SELECT * FROM sessions");
	return rows;
}

async function getSessionByCycleId(db, { cycleId }) {
	const { rows } = await pool.query(
		"SELECT * FROM sessions WHERE cycle_id = $1 ORDER BY session_order",
		[cycleId],
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

async function postNewSession(name, cycleId, sessionOrder) {
	const { rows: existCycle } = await pool.query(
		"SELECT COUNT(*) FROM cycles WHERE id = $1",
		[cycleId],
	);

	if (existCycle.length === 0) {
		throw new Error(`Cycle with ID ${cycleId} was not found`);
	}

	const { rows: howManySessions } = await pool.query(
		"SELECT COUNT(*) FROM sessions WHERE cycle_id = $1",
		[cycleId],
	);

	const numberOfSessions = Number(howManySessions[0].count);

	if (Number(sessionOrder) > numberOfSessions + 1) {
		throw new Error(`Session order must be at most ${numberOfSessions + 1}`);
	}

	if (Number(sessionOrder) === numberOfSessions + 1) {
		await pool.query(
			"INSERT INTO sessions (name, cycle_id, session_order) VALUES ($1, $2, $3)",
			[name, cycleId, Number(sessionOrder)],
		);
		return;
	}

	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		await client.query(
			"UPDATE sessions SET session_order = session_order + 1 WHERE cycle_id = $1 AND session_order >= $2",
			[cycleId, Number(sessionOrder)],
		);
		await client.query(
			"INSERT INTO sessions (name, cycle_id, session_order) VALUES ($1, $2, $3)",
			[name, cycleId, Number(sessionOrder)],
		);

		await client.query("COMMIT");
	} catch (err) {
		console.log({ err });
		await client.query("ROLLBACK");
		throw new Error("Failed to begin transaction");
	} finally {
		client.release();
	}
}

export {
	getAllSessions,
	getSessionByCycleId,
	getAllSessionsWithOutIds,
	postNewSession,
	insertSession,
};
