const validExerciseName = `NULLIF(BTRIM(wsl.exercise_name), '') IS NOT NULL`;
const snapshotExerciseName = `BTRIM(wsl.exercise_name)`;
const snapshotVariantName = `NULLIF(BTRIM(wsl.exercise_variant_name), '')`;
const completionDate = `(ws.finished_at AT TIME ZONE 'UTC')::date`;
const validRepetitions = `set_row.reps IS NOT NULL
	AND set_row.reps BETWEEN 0 AND 10000`;
const validLoad = `set_row.load_value IS NOT NULL
	AND set_row.load_value BETWEEN 0 AND 1000000`;
const validUnit = `set_row.load_unit IS NOT NULL
	AND BTRIM(set_row.load_unit) <> ''`;
const validVolume = `${validRepetitions} AND ${validLoad} AND ${validUnit}`;

/**
 * Lists immutable snapshot identities represented by performed steps in owned, finished
 * workouts. Missing legacy exercise snapshots are intentionally excluded because they
 * cannot provide a stable, honest identity.
 */
export function findChoicesForUser() {
	return `
		SELECT
			${snapshotExerciseName} AS exercise_name,
			${snapshotVariantName} AS exercise_variant_name,
			COUNT(DISTINCT ws.id)::integer AS occurrence_count,
			TO_CHAR(MIN(${completionDate}), 'YYYY-MM-DD') AS first_date,
			TO_CHAR(MAX(${completionDate}), 'YYYY-MM-DD') AS last_date
		FROM programs p
		JOIN cycles c ON c.program_id = p.id
		JOIN training_days td ON td.cycle_id = c.id
		JOIN workout_sessions ws ON ws.training_day_id = td.id
		JOIN workout_step_logs wsl ON wsl.workout_session_id = ws.id
		WHERE p.user_id = $1
			AND p.id = $2
			AND ws.status = 'finished'
			AND ws.finished_at IS NOT NULL
			AND wsl.status = 'performed'
			AND ${validExerciseName}
		GROUP BY ${snapshotExerciseName}, ${snapshotVariantName}
		ORDER BY LOWER(${snapshotExerciseName}), ${snapshotExerciseName},
			LOWER(${snapshotVariantName}) NULLS FIRST,
			${snapshotVariantName} NULLS FIRST;
	`;
}

/**
 * Returns progress only when the selected snapshot identity occurs in an owned, finished
 * workout for the supplied program. The summary covers the full filtered range; only the
 * most recent bounded occurrences are returned for presentation.
 */
export function findProgressForUser() {
	return `
		WITH owned_steps AS (
			SELECT
				ws.id AS workout_session_id,
				ws.finished_at,
				${completionDate} AS completion_date,
				COALESCE(NULLIF(BTRIM(ws.session_name), ''), 'Workout session') AS session_name,
				wsl.id AS step_log_id,
				${snapshotExerciseName} AS exercise_name,
				${snapshotVariantName} AS exercise_variant_name
			FROM programs p
			JOIN cycles c ON c.program_id = p.id
			JOIN training_days td ON td.cycle_id = c.id
			JOIN workout_sessions ws ON ws.training_day_id = td.id
			JOIN workout_step_logs wsl ON wsl.workout_session_id = ws.id
			WHERE p.user_id = $1
				AND p.id = $2
				AND ws.status = 'finished'
				AND ws.finished_at IS NOT NULL
				AND wsl.status = 'performed'
				AND ${validExerciseName}
		),
		selected_exercise AS (
			SELECT
				exercise_name,
				exercise_variant_name,
				COUNT(DISTINCT workout_session_id)::integer AS available_occurrence_count,
				MIN(completion_date) AS available_first_date,
				MAX(completion_date) AS available_last_date
			FROM owned_steps
			WHERE exercise_name = $3
				AND exercise_variant_name IS NOT DISTINCT FROM $4::text
			GROUP BY exercise_name, exercise_variant_name
		),
		filtered_steps AS (
			SELECT owned.*
			FROM owned_steps owned
			WHERE owned.exercise_name = $3
				AND owned.exercise_variant_name IS NOT DISTINCT FROM $4::text
				AND ($5::date IS NULL OR owned.completion_date >= $5::date)
				AND ($6::date IS NULL OR owned.completion_date <= $6::date)
		),
		set_facts AS (
			SELECT
				step.*,
				set_row.id AS set_id,
				set_row.reps,
				set_row.load_value,
				NULLIF(BTRIM(set_row.load_unit), '') AS load_unit
			FROM filtered_steps step
			LEFT JOIN workout_set_logs set_row ON set_row.workout_step_log_id = step.step_log_id
		),
		occurrence_totals AS (
			SELECT
				workout_session_id,
				completion_date,
				finished_at,
				session_name,
				COUNT(DISTINCT step_log_id)::integer AS performed_step_count,
				COUNT(set_id)::integer AS recorded_set_count,
				COUNT(set_id) FILTER (WHERE ${validRepetitions})::integer
					AS sets_with_repetitions_count,
				COALESCE(SUM(reps) FILTER (WHERE ${validRepetitions}), 0)::integer
					AS completed_repetition_count,
				COUNT(set_id) FILTER (WHERE ${validLoad} AND ${validUnit})::integer
					AS sets_with_load_count,
				COUNT(set_id) FILTER (WHERE ${validVolume})::integer
					AS sets_with_volume_count
			FROM set_facts set_row
			GROUP BY workout_session_id, completion_date, finished_at, session_name
		),
		occurrence_unit_rows AS (
			SELECT
				workout_session_id,
				BTRIM(load_unit) AS unit,
				COUNT(set_id)::integer AS load_observation_count,
				MAX(load_value) AS maximum_load,
				COUNT(set_id) FILTER (WHERE ${validRepetitions})::integer
					AS volume_set_count,
				SUM(reps * load_value) FILTER (WHERE ${validRepetitions}) AS volume
			FROM set_facts set_row
			WHERE ${validLoad} AND ${validUnit}
			GROUP BY workout_session_id, BTRIM(load_unit)
		),
		all_occurrences AS (
			SELECT
				totals.*,
				COALESCE(
					(
						SELECT JSONB_AGG(
							JSONB_BUILD_OBJECT(
								'unit', units.unit,
								'loadObservationCount', units.load_observation_count,
								'maximumLoad', units.maximum_load,
								'volumeSetCount', units.volume_set_count,
								'volume', units.volume
							)
							ORDER BY LOWER(units.unit), units.unit
						)
						FROM occurrence_unit_rows units
						WHERE units.workout_session_id = totals.workout_session_id
					),
					'[]'::jsonb
				) AS units
			FROM occurrence_totals totals
		),
		limited_occurrences AS (
			SELECT *
			FROM all_occurrences
			ORDER BY finished_at DESC, workout_session_id DESC
			LIMIT $7
		),
		summary_unit_rows AS (
			SELECT
				BTRIM(load_unit) AS unit,
				COUNT(set_id)::integer AS load_observation_count,
				MAX(load_value) AS maximum_load,
				COUNT(set_id) FILTER (WHERE ${validRepetitions})::integer
					AS volume_set_count,
				SUM(reps * load_value) FILTER (WHERE ${validRepetitions}) AS volume
			FROM set_facts set_row
			WHERE ${validLoad} AND ${validUnit}
			GROUP BY BTRIM(load_unit)
		),
		summary AS (
			SELECT
				COUNT(DISTINCT workout_session_id)::integer AS occurrence_count,
				COUNT(DISTINCT step_log_id)::integer AS performed_step_count,
				COUNT(set_id)::integer AS recorded_set_count,
				COUNT(set_id) FILTER (WHERE ${validRepetitions})::integer
					AS sets_with_repetitions_count,
				COALESCE(SUM(reps) FILTER (WHERE ${validRepetitions}), 0)::integer
					AS completed_repetition_count,
				COUNT(set_id) FILTER (WHERE ${validLoad} AND ${validUnit})::integer
					AS sets_with_load_count,
				COUNT(set_id) FILTER (WHERE ${validVolume})::integer
					AS sets_with_volume_count
			FROM set_facts set_row
		)
		SELECT
			selected.exercise_name,
			selected.exercise_variant_name,
			selected.available_occurrence_count,
			TO_CHAR(selected.available_first_date, 'YYYY-MM-DD') AS available_first_date,
			TO_CHAR(selected.available_last_date, 'YYYY-MM-DD') AS available_last_date,
			JSONB_BUILD_OBJECT(
				'occurrenceCount', summary.occurrence_count,
				'performedStepCount', summary.performed_step_count,
				'recordedSetCount', summary.recorded_set_count,
				'setsWithRepetitionsCount', summary.sets_with_repetitions_count,
				'completedRepetitionCount', summary.completed_repetition_count,
				'setsWithLoadCount', summary.sets_with_load_count,
				'setsWithVolumeCount', summary.sets_with_volume_count,
				'units', COALESCE(
					(
						SELECT JSONB_AGG(
							JSONB_BUILD_OBJECT(
								'unit', units.unit,
								'loadObservationCount', units.load_observation_count,
								'maximumLoad', units.maximum_load,
								'volumeSetCount', units.volume_set_count,
								'volume', units.volume
							)
							ORDER BY LOWER(units.unit), units.unit
						)
						FROM summary_unit_rows units
					),
					'[]'::jsonb
				)
			) AS summary,
			(SELECT COUNT(*)::integer FROM all_occurrences) AS total_occurrence_count,
			COALESCE(
				(
					SELECT JSONB_AGG(
						JSONB_BUILD_OBJECT(
							'workoutSessionId', occurrence.workout_session_id,
							'dateKey', TO_CHAR(occurrence.completion_date, 'YYYY-MM-DD'),
							'finishedAt', occurrence.finished_at,
							'sessionName', occurrence.session_name,
							'performedStepCount', occurrence.performed_step_count,
							'recordedSetCount', occurrence.recorded_set_count,
							'setsWithRepetitionsCount', occurrence.sets_with_repetitions_count,
							'completedRepetitionCount', occurrence.completed_repetition_count,
							'setsWithLoadCount', occurrence.sets_with_load_count,
							'setsWithVolumeCount', occurrence.sets_with_volume_count,
							'units', occurrence.units
						)
						ORDER BY occurrence.finished_at, occurrence.workout_session_id
					)
					FROM limited_occurrences occurrence
				),
				'[]'::jsonb
			) AS occurrences
		FROM selected_exercise selected
		CROSS JOIN summary;
	`;
}
