export function findAll() {
	return `
		SELECT
			ws.id,
			ws.training_day_id,
			ws.session_id,
			ws.workout_session_order,
			ws.status,
			ws.started_at,
			ws.finished_at,
			ws.notes,

			se.name,
			se.is_archived,
			se.notes AS session_notes,

			(
				SELECT COALESCE(
					json_agg(
						json_build_object(
							'id', ss.id,
							'name', ss.name,
							'sets', ss.sets,
							'reps', ss.reps,
							'load_value', ss.load_value,
							'load_unit', ss.load_unit,
							'step_order', ss.step_order,

							'step_type_name', st.name,
							'exercise_variant_name', ev.name,
							'exercise_name', ex.name,
							'movement_pattern_name', mp.name,
							'equipment_name', eq.name,
							'equipment_category', eq.category,

							'step_log',
								CASE
									WHEN wsl.id IS NULL THEN NULL
									ELSE to_jsonb(wsl)
								END,

							'muscles', (
								SELECT COALESCE(
									json_agg(
										json_build_object(
											'common_name', m.common_name,
											'scientific_name', m.scientific_name,
											'body_region', m.body_region,
											'reference_url', m.reference_url
										)
									),
									'[]'
								)
								FROM exercise_muscles AS em
								JOIN muscles AS m
									ON em.muscle_id = m.id
								WHERE em.exercise_id = ex.id
							)
						)
						ORDER BY ss.step_order
					),
					'[]'
				)
				FROM session_steps AS ss
				JOIN step_types AS st
					ON ss.step_type_id = st.id
				JOIN exercise_variants AS ev
					ON ss.exercise_variant_id = ev.id
				JOIN exercises AS ex
					ON ev.exercise_id = ex.id
				JOIN movement_patterns AS mp
					ON ex.movement_pattern_id = mp.id
				JOIN equipments AS eq
					ON ev.equipment_id = eq.id

				LEFT JOIN workout_step_logs AS wsl
					ON wsl.session_step_id = ss.id
					AND wsl.workout_session_id = ws.id

				WHERE ss.session_id = se.id
			) AS steps

		FROM workout_sessions AS ws
		JOIN sessions AS se
			ON ws.session_id = se.id
		WHERE ws.training_day_id = $1
		ORDER BY ws.workout_session_order;
		`;
}

export function findAllByProgramId() {
	return `
		SELECT workoutSession.*, 
		trainingDay.cycle_id AS cycle_id, 
		trainingDay.day_order AS day_order, 
		trainingDay.scheduled_date AS scheduled_date,
		cycle.program_id AS program_id,
		cycle.name AS cycle_name,
		cycle.cycle_size AS cycle_size,
		cycle.cycle_order AS cycle_order,
		session.name AS session_name,
		session.notes AS session_notes


		FROM workout_sessions AS workoutSession
		JOIN training_days AS trainingDay ON workoutSession.training_day_id = trainingDay.id
		JOIN cycles AS cycle ON trainingDay.cycle_id = cycle.id
		JOIN sessions AS session ON workoutSession.session_id = session.id

		WHERE cycle.program_id = $1

		ORDER BY
		cycle_order,
		day_order
	`;
}
