import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

export async function findAll(db = pool) {
	const { rows } = await db.query(queries.findAllQuery());
	return rows;
}
