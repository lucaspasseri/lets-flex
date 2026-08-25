import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

/**
 * @typedef  {import("./cycles.types.js").CycleRow} CycleRow
 * @typedef  {import("./cycles.types.js").CycleQueryRow} CycleQueryRow
 * @typedef  {import("../users/users.types.js").UserRow} UserRow
 * @typedef  {import("pg").Pool | import("pg").PoolClient} DatabaseClient
 * @param {DatabaseClient} [db]
 */

/**
 * @typedef {object} FindByIdInput
 * @property {CycleRow["id"]} cycleId
 */

/**
 * @typedef {object} FindByAllByUserIdInput
 * @property {UserRow["id"]} userId
 */

/**
 * @param {FindByIdInput} input
 * @returns {Promise<CycleRow | null>}
 */

export async function findById({ cycleId }, db = pool) {
	const { rows } = await db.query(
		"SELECT * FROM cycles WHERE id = $1 ORDER BY cycle_order",
		[cycleId],
	);

	return rows[0] ?? null;
}

/** @param {{programId: number}} input @param {DatabaseClient} [db] */
export async function findAllByProgramId({ programId }, db = pool) {
	const { rows } = await db.query(
		"SELECT * FROM cycles WHERE program_id = $1 ORDER BY cycle_order ASC",
		[programId],
	);

	return rows;
}

/**
 * @param {FindByAllByUserIdInput} input
 * @returns {Promise<CycleQueryRow[]>}
 */

export async function findAllByUserId({ userId }, db = pool) {
	const { rows } = await db.query(
		`SELECT
		c.*,
		p.id AS program_id,
		p.name AS program_name,
		p.start_date AS program_start_date
		FROM cycles AS c
		JOIN programs AS p
			ON p.id = c.program_id
		WHERE p.user_id = $1
		ORDER BY c.cycle_order ASC`,
		[userId],
	);

	return rows;
}

/** @param {{programId: number, cycleOrder: number}} input @param {DatabaseClient} [db] */
export async function shiftCycleOrder({ programId, cycleOrder }, db = pool) {
	await db.query(queries.bumpCycleOrdersQuery(), [programId, cycleOrder]);

	await db.query(queries.normalizeCycleOrdersQuery(), [programId, cycleOrder]);
}

/** @param {{programId: number, name: string, cycleSize: number, cycleOrder: number}} input @param {DatabaseClient} [db] */
export async function create({ programId, name, cycleSize, cycleOrder }, db = pool) {
	const { rows } = await db.query(
		"INSERT INTO cycles (name, program_id, cycle_size, cycle_order) VALUES ($1, $2, $3, $4) RETURNING *",
		[name, programId, cycleSize, cycleOrder],
	);

	return rows[0];
}

/** Deletes only a cycle whose program belongs to the active user. */
export async function deleteByIdForUser({ cycleId, userId }, db = pool) {
	const { rows } = await db.query(
		`DELETE FROM cycles AS c
		 WHERE c.id = $1
		   AND EXISTS (
		     SELECT 1 FROM programs AS p
		     WHERE p.id = c.program_id AND p.user_id = $2
		   )
		 RETURNING c.*`,
		[cycleId, userId],
	);
	return rows[0] ?? null;
}

/** Closes the ordering gap without violating the unique program/order constraint. */
export async function closeCycleOrderGap({ programId, cycleOrder }, db = pool) {
	await db.query(
		"UPDATE cycles SET cycle_order = cycle_order + 1000 WHERE program_id = $1 AND cycle_order > $2",
		[programId, cycleOrder],
	);
	await db.query(
		"UPDATE cycles SET cycle_order = cycle_order - 1001 WHERE program_id = $1 AND cycle_order > $2 + 1000",
		[programId, cycleOrder],
	);
}
