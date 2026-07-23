import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

export async function findById({ cycleId }, db = pool) {
	const { rows } = await db.query(
		"SELECT * FROM cycles WHERE id = $1 ORDER BY cycle_order",
		[cycleId],
	);

	return rows[0] ?? null;
}

export async function findAllByProgramId({ programId }, db = pool) {
	const { rows } = await db.query(
		"SELECT * FROM cycles WHERE program_id = $1 ORDER BY cycle_order ASC",
		[programId],
	);

	return rows;
}

export async function shiftCycleOrder({ programId, cycleOrder }, db = pool) {
	await db.query(queries.bumpCycleOrdersQuery(), [programId, cycleOrder]);

	await db.query(queries.normalizeCycleOrdersQuery(), [programId, cycleOrder]);
}

export async function create(
	{ programId, name, cycleSize, cycleOrder },
	db = pool,
) {
	const { rows } = await db.query(
		"INSERT INTO cycles (name, program_id, cycle_size, cycle_order) VALUES ($1, $2, $3, $4) RETURNING *",
		[name, programId, cycleSize, cycleOrder],
	);

	return rows[0];
}
