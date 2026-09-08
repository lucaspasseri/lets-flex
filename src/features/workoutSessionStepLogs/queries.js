export function createAll() {
	return `
		INSERT INTO workout_step_logs (
			workout_session_id,
			session_step_id,
			status,
			step_order,
			step_type_id,
			exercise_variant_id,
			name,
			step_type_name,
			exercise_name,
			exercise_variant_name,
			planned_sets,
			planned_reps,
			planned_load_value,
			planned_load_unit
		)
		SELECT
			$1,
			ss.id,
			'planned',
			ss.step_order,
			ss.step_type_id,
			ss.exercise_variant_id,
			ss.name,
			st.name,
			ex.name,
			ev.name,
			ss.sets,
			ss.reps,
			ss.load_value,
			ss.load_unit
		FROM session_steps ss
		JOIN step_types st ON st.id = ss.step_type_id
		LEFT JOIN exercise_variants ev ON ev.id = ss.exercise_variant_id
		LEFT JOIN exercises ex ON ex.id = ev.exercise_id
		WHERE ss.session_id = $2
		ORDER BY ss.step_order
		RETURNING *
		`;
}
