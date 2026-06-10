async function insertSession(db, { name, notes }) {
	const { rows } = await db.query(
		`
		INSERT INTO sessions (name, notes) VALUES ($1, $2) RETURNING *
		`,
		[name, notes],
	);
	return rows;
}

async function getAllSessions(db) {
	const { rows } = await db.query("SELECT * FROM sessions");
	return rows;
}

async function getAllSessionsWithExerciseInfo(db) {
	const { rows } = await db.query(
		`
		SELECT 
			se.id,
			se.name,
			se.notes,
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
							'muscles', (
								SELECT COALESCE(
									json_agg(
										json_build_object(
											'common_name', m.common_name,
											'scientific_name', m.scientific_name
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
				WHERE ss.session_id = se.id
			) AS steps
		FROM sessions AS se
		ORDER BY se.id;
`,
	);

	return rows;
}

export { insertSession, getAllSessions, getAllSessionsWithExerciseInfo };
