export function getDistinctMovements(session) {
	return [
		...new Set(
			(session.steps ?? []).map(step => step.movementPattern).filter(Boolean),
		),
	];
}

export function getDistinctMuscles(session) {
	return [
		...new Set(
			(session.steps ?? []).flatMap(step =>
				(step.muscles ?? []).map(muscle => muscle.commonName).filter(Boolean),
			),
		),
	];
}

export function getDistinctEquipments(session) {
	return [
		...new Set(
			(session.steps ?? []).map(step => step.equipment?.name).filter(Boolean),
		),
	];
}
