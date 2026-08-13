import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

export async function findAll(db = pool) {
	const { rows } = await db.query(queries.findAllQuery());
	return rows;
}

export async function find({ exerciseId }, db = pool) {
	const { rows } = await db.query(queries.findByIdQuery(), [exerciseId]);
	return rows[0] ?? null;
}
