import { addDays } from "date-fns";

async function getSessionsByProgramIdAndScheduleDate(
	db,
	{ programId, currDay, startDate, daysDifference },
) {
	if (programId === null || currDay === null) return [];

	const { rows } = await db.query(
		`
	SELECT
	s.id AS session_id,
	s.name AS session_name,
	s.notes AS session_note,
	s.session_order,

	t.id AS training_day_id,
	t.label AS training_day_label,
	t.day_order,
	t.scheduled_date,

	c.id AS cycle_id,
	c.name AS cycle_name,
	c.cycle_order

FROM sessions AS s

JOIN training_days AS t
	ON s.training_day_id = t.id

JOIN cycles AS c
	ON t.cycle_id = c.id

WHERE c.program_id = $1
	AND t.scheduled_date >= $2
	AND t.scheduled_date < $3

ORDER BY
	t.scheduled_date,
	c.cycle_order,
	t.day_order,
	s.session_order
	`,
		[programId, addDays(currDay, -3), addDays(currDay, 4)],
	);

	return rows;
}

export default getSessionsByProgramIdAndScheduleDate;
