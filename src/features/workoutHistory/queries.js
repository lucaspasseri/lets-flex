const historyDateSql = `CASE
	WHEN ws.status = 'finished' THEN (ws.finished_at AT TIME ZONE 'UTC')::date
	ELSE td.scheduled_date
END`;

/**
 * Lists only terminal sessions owned by the supplied user. Finished workouts are
 * attributed to their UTC completion date; cancelled workouts retain their scheduled
 * program date. Undated cancellations remain visible after dated records.
 */
export function findPageForUser() {
	return `
		WITH owned_history AS (
			SELECT
				ws.id,
				ws.status,
				${historyDateSql} AS history_date,
				td.scheduled_date,
				ws.started_at,
				ws.finished_at,
				p.id AS program_id,
				p.name AS program_name,
				COALESCE(ws.session_name, 'Workout session') AS session_name
			FROM programs p
			JOIN cycles c ON c.program_id = p.id
			JOIN training_days td ON td.cycle_id = c.id
			JOIN workout_sessions ws ON ws.training_day_id = td.id
			WHERE p.user_id = $1
				AND ws.status IN ('finished', 'cancelled')
				AND ($2::integer IS NULL OR p.id = $2)
				AND ($3::date IS NULL OR ${historyDateSql} >= $3::date)
				AND ($4::date IS NULL OR ${historyDateSql} <= $4::date)
		),
		page_rows AS (
			SELECT
				history.*,
				(
					SELECT COUNT(*)::integer
					FROM workout_step_logs wsl
					WHERE wsl.workout_session_id = history.id
				) AS step_count,
				(
					SELECT COUNT(*)::integer
					FROM workout_step_logs wsl
					WHERE wsl.workout_session_id = history.id
						AND wsl.status = 'performed'
				) AS performed_step_count,
				(
					SELECT COUNT(*)::integer
					FROM workout_step_logs wsl
					WHERE wsl.workout_session_id = history.id
						AND wsl.status = 'skipped'
				) AS skipped_step_count
			FROM owned_history history
			ORDER BY history.history_date DESC NULLS LAST,
				history.finished_at DESC NULLS LAST,
				history.id DESC
			LIMIT $5 OFFSET $6
		)
		SELECT
			(SELECT COUNT(*)::integer FROM owned_history) AS total_count,
			COALESCE(
				(
					SELECT JSONB_AGG(
						TO_JSONB(page_rows)
						ORDER BY page_rows.history_date DESC NULLS LAST,
							page_rows.finished_at DESC NULLS LAST,
							page_rows.id DESC
					)
					FROM page_rows
				),
				'[]'::jsonb
			) AS items;
	`;
}

/** Returns one terminal session only when it belongs to the supplied user. */
export function findDetailForUser() {
	return `
		WITH owned_session AS (
			SELECT
				ws.id,
				ws.status,
				${historyDateSql} AS history_date,
				td.scheduled_date,
				ws.started_at,
				ws.finished_at,
				p.id AS program_id,
				p.name AS program_name,
				COALESCE(ws.session_name, 'Workout session') AS session_name,
				ws.notes
			FROM workout_sessions ws
			JOIN training_days td ON td.id = ws.training_day_id
			JOIN cycles c ON c.id = td.cycle_id
			JOIN programs p ON p.id = c.program_id
			WHERE ws.id = $1
				AND p.user_id = $2
				AND ws.status IN ('finished', 'cancelled')
		)
		SELECT
			owned.*,
			COALESCE(
				(
					SELECT JSONB_AGG(
						JSONB_BUILD_OBJECT(
							'id', wsl.id,
							'order', wsl.step_order,
							'status', wsl.status,
							'name', wsl.name,
							'stepTypeName', wsl.step_type_name,
							'exerciseName', wsl.exercise_name,
							'exerciseVariantName', wsl.exercise_variant_name,
							'plannedSets', wsl.planned_sets,
							'plannedReps', wsl.planned_reps,
							'plannedLoadValue', wsl.planned_load_value,
							'plannedLoadUnit', wsl.planned_load_unit,
							'startedAt', wsl.started_at,
							'completedAt', wsl.completed_at,
							'notes', wsl.notes,
							'sets', COALESCE(
								(
									SELECT JSONB_AGG(
										JSONB_BUILD_OBJECT(
											'id', wset.id,
											'order', wset.set_order,
											'reps', wset.reps,
											'loadValue', wset.load_value,
											'loadUnit', wset.load_unit
										)
										ORDER BY wset.set_order, wset.id
									)
									FROM workout_set_logs wset
									WHERE wset.workout_step_log_id = wsl.id
								),
								'[]'::jsonb
							)
						)
						ORDER BY wsl.step_order, wsl.id
					)
					FROM workout_step_logs wsl
					WHERE wsl.workout_session_id = owned.id
				),
				'[]'::jsonb
			) AS steps
		FROM owned_session owned;
	`;
}
