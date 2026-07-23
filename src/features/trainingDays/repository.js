import pool from "../../../db/pool.js";

export async function findAllByProgramId({ programId }, db = pool) {
	const { rows } = await db.query(
		"SELECT training_days.id AS training_day_id, training_days.day_order, cycle_id, cycle_order, program_id, scheduled_date FROM training_days JOIN cycles ON training_days.cycle_id = cycles.id WHERE cycles.program_id = $1 ORDER BY cycles.cycle_order, training_days.day_order",
		[programId],
	);

	return rows;
}

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

export async function create(
	{ cycleId, dayOrder, label, scheduledDate },
	db = pool,
) {
	const { rows } = await db.query(
		"INSERT INTO training_days ( cycle_id, day_order, label, scheduled_date) VALUES ($1, $2, $3, $4) RETURNING *",
		[cycleId, dayOrder, label, scheduledDate],
	);

	return rows[0];
}
