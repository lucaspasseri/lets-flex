import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

export async function findAllForUser({ userId }, db = pool) {
	const { rows } = await db.query(queries.findAllQuery(), [userId]);
	return rows;
}

export async function find({ exerciseId }, db = pool) {
	const { rows } = await db.query(queries.findByIdQuery(), [exerciseId]);
	return rows[0] ?? null;
}
