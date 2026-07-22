import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

export async function findAll(db = pool) {
	console.log(1);
	const { rows } = await db.query(queries.findAllQuery());
	console.log({ rows });
	return rows;
}
