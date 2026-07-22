import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

export async function findAll(db = pool) {
	const { rows } = await db.query(queries.findAllQuery());
	return rows;
}

export async function create({ name, notes }, db = pool) {
	const { rows } = await db.query(
		"INSERT INTO sessions (name, notes) VALUES ($1, $2) RETURNING id",
		[name, notes],
	);

	return rows[0] ?? null;
}

export async function archive({ sessionId }, db = pool) {
	await db.query(
		`
			UPDATE sessions
			SET is_archived = TRUE
			WHERE id = $1;
		`,
		[sessionId],
	);
}

export async function findById({ sessionId }, db = pool) {
	const { rows } = await db.query("SELECT * FROM sessions WHERE id = $1", [
		sessionId,
	]);

	return rows[0] ?? null;
}
