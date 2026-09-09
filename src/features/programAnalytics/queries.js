export function findByProgramIdForUser() {
	return `
		WITH owned_program AS (
			SELECT
				p.id,
				p.start_date,
				COALESCE(SUM(c.cycle_size), 0)::integer AS total_days
			FROM programs p
			LEFT JOIN cycles c ON c.program_id = p.id
			WHERE p.id = $1 AND p.user_id = $2
			GROUP BY p.id, p.start_date
		),
		program_sessions AS (
			SELECT ws.id, ws.status, ws.finished_at, td.scheduled_date
			FROM owned_program op
			JOIN cycles c ON c.program_id = op.id
			JOIN training_days td ON td.cycle_id = c.id
			JOIN workout_sessions ws ON ws.training_day_id = td.id
		),
		activity_rows AS (
			SELECT
				TO_CHAR((finished_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') AS date_key,
				COUNT(*)::integer AS finished_count
			FROM program_sessions
			WHERE status = 'finished' AND finished_at IS NOT NULL
			GROUP BY (finished_at AT TIME ZONE 'UTC')::date
		),
		week_buckets AS (
			SELECT
				weeks.week_index::integer AS week_index,
				op.start_date + weeks.week_index * 7 AS week_start_date,
				LEAST(
					op.start_date + weeks.week_index * 7 + 6,
					op.start_date + op.total_days - 1
				) AS week_end_date
			FROM owned_program op
			CROSS JOIN LATERAL GENERATE_SERIES(
				0,
				CEIL(op.total_days / 7.0)::integer - 1
			) AS weeks(week_index)
			WHERE op.start_date IS NOT NULL
		),
		adherence_rows AS (
			SELECT
				wb.week_index,
				wb.week_start_date,
				wb.week_end_date,
				COUNT(ps.id)::integer AS scheduled_count,
				COUNT(ps.id) FILTER (WHERE ps.status = 'finished')::integer AS finished_count,
				COUNT(ps.id) FILTER (WHERE ps.status = 'cancelled')::integer AS cancelled_count,
				COUNT(ps.id) FILTER (WHERE ps.status = 'planned')::integer AS planned_count,
				COUNT(ps.id) FILTER (WHERE ps.status = 'in_progress')::integer AS in_progress_count
			FROM week_buckets wb
			LEFT JOIN program_sessions ps
				ON ps.scheduled_date >= wb.week_start_date
				AND ps.scheduled_date <= wb.week_end_date
			GROUP BY wb.week_index, wb.week_start_date, wb.week_end_date
		),
		performed_steps AS (
			SELECT wsl.id
			FROM program_sessions ps
			JOIN workout_step_logs wsl ON wsl.workout_session_id = ps.id
			WHERE wsl.status = 'performed'
		),
		performed_sets AS (
			SELECT wset.id, wset.reps, wset.load_value, wset.load_unit
			FROM performed_steps performed
			JOIN workout_set_logs wset ON wset.workout_step_log_id = performed.id
		),
		performed_work AS (
			SELECT
				(SELECT COUNT(*)::integer FROM performed_steps) AS performed_step_count,
				COUNT(*)::integer AS recorded_set_count,
				COALESCE(SUM(reps) FILTER (WHERE reps IS NOT NULL), 0)::integer
					AS completed_repetition_count,
				COUNT(*) FILTER (WHERE reps IS NOT NULL)::integer AS sets_with_repetitions_count
			FROM performed_sets
		),
		load_volume_rows AS (
			SELECT
				load_unit,
				SUM(reps * load_value) AS volume,
				COUNT(*)::integer AS set_count
			FROM performed_sets
			WHERE reps IS NOT NULL
				AND load_value IS NOT NULL
				AND load_unit IS NOT NULL
				AND BTRIM(load_unit) <> ''
			GROUP BY load_unit
		)
		SELECT
			COALESCE(
				(
					SELECT JSONB_AGG(
						JSONB_BUILD_OBJECT(
							'dateKey', date_key,
							'finishedCount', finished_count
						)
						ORDER BY date_key
					)
					FROM activity_rows
				),
				'[]'::jsonb
			) AS activity,
			COALESCE(
				(
					SELECT JSONB_AGG(
						JSONB_BUILD_OBJECT(
							'weekIndex', week_index,
							'weekStartDate', TO_CHAR(week_start_date, 'YYYY-MM-DD'),
							'weekEndDate', TO_CHAR(week_end_date, 'YYYY-MM-DD'),
							'scheduledCount', scheduled_count,
							'finishedCount', finished_count,
							'cancelledCount', cancelled_count,
							'plannedCount', planned_count,
							'inProgressCount', in_progress_count
						)
						ORDER BY week_index
					)
					FROM adherence_rows
				),
				'[]'::jsonb
			) AS adherence,
			JSONB_BUILD_OBJECT(
				'performedStepCount', performed_step_count,
				'recordedSetCount', recorded_set_count,
				'completedRepetitionCount', completed_repetition_count,
				'setsWithRepetitionsCount', sets_with_repetitions_count
			) AS performed_work,
			COALESCE(
				(
					SELECT JSONB_AGG(
						JSONB_BUILD_OBJECT(
							'unit', load_unit,
							'volume', volume,
							'setCount', set_count
						)
						ORDER BY LOWER(load_unit), load_unit
					)
					FROM load_volume_rows
				),
				'[]'::jsonb
			) AS load_volume
		FROM owned_program op
		CROSS JOIN performed_work;
	`;
}
