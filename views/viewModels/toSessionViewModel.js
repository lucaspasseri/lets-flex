function toSessionViewModel(session, { type }) {
	return {
		type,

		id: session.id,
		name: session.name,
		notes: session.notes,
		isArchived: session.is_archived,
		status: session.status ?? null,
		startedAt: session.started_at ?? null,
		finishedAt: session.finished_at ?? null,
		steps: session.steps.map(toStepViewModel),
	};

	function toStepViewModel(step) {
		return {
			id: step.id,
			name: step.name,
			order: step.step_order,
			typeName: step.step_type_name,
			exerciseVariantName: step.exercise_variant_name,
			exerciseName: step.exercise_name,
			movementPatternName: step.movement_pattern_name,
			equipmentName: step.equipment_name,
			equipmentCategory: step.equipment_category,
			sets: step.sets,
			reps: step.reps,
			loadValue: step.load_value,
			loadUnit: step.load_unit,
			muscles: step.muscles ?? [],
		};
	}
}

export { toSessionViewModel };
