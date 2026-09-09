import pool from "../../../db/pool.js";

/**
 * @typedef {import("./trainingDays.types.js").ProgramTrainingDayRow} ProgramTrainingDayRow
 * @typedef {import("./trainingDays.types.js").OwnedTrainingDayContextRow} OwnedTrainingDayContextRow
 * @typedef {import("../programs/programs.types.js").ProgramRow} ProgramRow
 * @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient
 */

/**
 * @typedef {object} FindAllByProgramIdInput
 * @property {ProgramRow["id"]} programId
 */

export async function findById({ trainingDayId }, db = pool) {
	const { rows } = await db.query("SELECT * FROM training_days WHERE id = $1", [
		trainingDayId,
	]);

	return rows[0] ?? null;
}

/**
 * Resolves a day and its hierarchy with ownership enforced in the query.
 *
 * @param {{trainingDayId: number, userId: number}} input
 * @param {DatabaseClient} [db]
 * @returns {Promise<OwnedTrainingDayContextRow | null>}
 */
export async function findContextByIdForUser({ trainingDayId, userId }, db = pool) {
	const { rows } = await db.query(
		`SELECT td.id, td.cycle_id, td.day_order, td.scheduled_date, td.label,
		        c.name AS cycle_name, c.cycle_size, c.cycle_order, c.program_id,
		        p.user_id, p.goal_id, p.name AS program_name,
		        p.start_date AS program_start_date
		 FROM training_days AS td
		 JOIN cycles AS c ON c.id = td.cycle_id
		 JOIN programs AS p ON p.id = c.program_id
		 WHERE td.id = $1 AND p.user_id = $2`,
		[trainingDayId, userId],
	);

	return rows[0] ?? null;
}

/**
 * @param {FindAllByProgramIdInput} input
 * @returns {Promise<ProgramTrainingDayRow[]>}
 */

export async function findAllByProgramId({ programId }, db = pool) {
	const { rows } = await db.query(
		"SELECT training_days.id AS id, training_days.day_order, training_days.label, training_days.cycle_id, cycles.cycle_order, cycles.program_id, training_days.scheduled_date FROM training_days JOIN cycles ON training_days.cycle_id = cycles.id WHERE cycles.program_id = $1 ORDER BY cycles.cycle_order, training_days.day_order",
		[programId],
	);

	return rows;
}

/** @param {any} input @param {DatabaseClient} [db] */
export async function create({ cycleId, dayOrder, label, scheduledDate }, db = pool) {
	const { rows } = await db.query(
		"INSERT INTO training_days ( cycle_id, day_order, label, scheduled_date) VALUES ($1, $2, $3, $4) RETURNING *",
		[cycleId, dayOrder, label, scheduledDate],
	);

	return rows[0];
}

/** @param {any} input @param {DatabaseClient} [db] */
export async function shiftScheduledDates(
	{ programId, cycleOrder, amountOfDays },
	db = pool,
) {
	await db.query(
		`
			UPDATE training_days td
			SET scheduled_date = td.scheduled_date + ($3::int * INTERVAL '1 day')
			FROM cycles c
			WHERE td.cycle_id = c.id
				AND c.program_id = $1
				AND c.cycle_order > $2
		`,
		[programId, cycleOrder, amountOfDays],
	);
}

export async function findByProgramIdAndScheduledDate(
	{ programId, scheduledDate },
	db = pool,
) {
	const { rows } = await db.query(
		"SELECT * FROM training_days WHERE scheduled_date = $1 AND cycle_id IN (SELECT id FROM cycles WHERE program_id = $2)",
		[scheduledDate, programId],
	);

	return rows[0] ?? null;
}
