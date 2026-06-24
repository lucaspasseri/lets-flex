function toSessionViewModel(session, { type }) {
	return {
		type,

		id: session.id,
		name: session.name,
		notes: session.notes,
		sessionNotes: session.session_notes,
		isArchived: session.is_archived,
		status: session.status ?? null,
		startedAt: session.started_at ?? null,
		finishedAt: session.finished_at ?? null,
		steps: (session.steps ?? []).map(toStepViewModel),
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

			stepLog: toStepLogViewModel(step.step_log),
		};
	}

	function toStepLogViewModel(stepLog) {
		if (!stepLog) return null;

		return {
			id: stepLog.id,
			workoutSessionId: stepLog.workout_session_id,
			sessionStepId: stepLog.session_step_id,

			status: stepLog.status ?? "none",

			performedAt: stepLog.performed_at ?? null,

			plannedSets: stepLog.planned_sets ?? null,
			plannedReps: stepLog.planned_reps ?? null,
			plannedLoadValue: stepLog.planned_load_value ?? null,
			plannedLoadUnit: stepLog.planned_load_unit ?? null,

			performedSets: stepLog.performed_sets ?? null,
			performedReps: stepLog.performed_reps ?? null,
			performedLoadValue: stepLog.performed_load_value ?? null,
			performedLoadUnit: stepLog.performed_load_unit ?? null,
		};
	}
}

export { toSessionViewModel };
