import {
	localizedCatalogJoinSql,
	localizedCatalogLocaleSql,
	localizedCatalogValueSql,
} from "../catalogLocalization/catalogLocalization.js";

export function findAll({ localeParameter = "$2" } = {}) {
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
							'exercise_variant_name', ${localizedCatalogValueSql({ alias: "exercise_variant_translation", canonicalExpression: "ev.name" })},
							'exercise_variant_name_locale', ${localizedCatalogLocaleSql({ alias: "exercise_variant_translation" })},
							'canonical_exercise_variant_name', ev.name,
							'exercise_variant_setup_description', ev.setup_description,
							'exercise_variant_environment', ev.environment,
							'exercise_variant_notes', ev.notes,
							'exercise_name', ${localizedCatalogValueSql({ alias: "exercise_translation", canonicalExpression: "ex.name" })},
							'exercise_name_locale', ${localizedCatalogLocaleSql({ alias: "exercise_translation" })},
							'canonical_exercise_name', ex.name,
							'movement_pattern_name', ${localizedCatalogValueSql({ alias: "movement_pattern_translation", canonicalExpression: "mp.name" })},
							'movement_pattern_name_locale', ${localizedCatalogLocaleSql({ alias: "movement_pattern_translation" })},
							'canonical_movement_pattern_name', mp.name,
							'equipment_name', ${localizedCatalogValueSql({ alias: "equipment_translation", canonicalExpression: "eq.name" })},
							'equipment_name_locale', ${localizedCatalogLocaleSql({ alias: "equipment_translation" })},
							'canonical_equipment_name', eq.name,
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
															'id', m.id,
																'common_name', ${localizedCatalogValueSql({ alias: "muscle_translation", canonicalExpression: "m.common_name" })},
																'common_name_locale', ${localizedCatalogLocaleSql({ alias: "muscle_translation" })},
																'canonical_common_name', m.common_name,
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
								${localizedCatalogJoinSql({
									translationTable: "muscle_translations",
									translationEntityColumn: "muscle_id",
									entityIdExpression: "m.id",
									alias: "muscle_translation",
									localeParameter,
								})}
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
				LEFT JOIN equipments AS eq
					ON ev.equipment_id = eq.id
				${localizedCatalogJoinSql({
					translationTable: "exercise_translations",
					translationEntityColumn: "exercise_id",
					entityIdExpression: "ex.id",
					alias: "exercise_translation",
					localeParameter,
				})}
				${localizedCatalogJoinSql({
					translationTable: "exercise_variant_translations",
					translationEntityColumn: "exercise_variant_id",
					entityIdExpression: "ev.id",
					alias: "exercise_variant_translation",
					localeParameter,
					additionalCondition: "ev.owner_user_id IS NULL",
				})}
				${localizedCatalogJoinSql({
					translationTable: "movement_pattern_translations",
					translationEntityColumn: "movement_pattern_id",
					entityIdExpression: "mp.id",
					alias: "movement_pattern_translation",
					localeParameter,
				})}
				${localizedCatalogJoinSql({
					translationTable: "equipment_translations",
					translationEntityColumn: "equipment_id",
					entityIdExpression: "eq.id",
					alias: "equipment_translation",
					localeParameter,
				})}

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
		session.notes AS session_notes,
		session.is_archived AS is_archived


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
