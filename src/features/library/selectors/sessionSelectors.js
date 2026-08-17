/**
 * @typedef {import("../../sessions/sessions.types.js").SessionMapper} SessionTemplate
 */

/**
 * @param {SessionTemplate} session
 * @returns {string[]}
 */

export function getDistinctMovements(session) {
	return [
		...new Set(
			(session.steps ?? []).map(step => step.movementPattern).filter(Boolean),
		),
	];
}

/**
 * @param {SessionTemplate} session
 * @returns {string[]}
 */

export function getDistinctMuscles(session) {
	return [
		...new Set(
			(session.steps ?? []).flatMap(step =>
				(step.muscles ?? []).map(muscle => muscle.commonName).filter(Boolean),
			),
		),
	];
}

/**
 * @param {SessionTemplate} session
 * @returns {string[]}
 */

export function getDistinctEquipments(session) {
	return [
		...new Set(
			(session.steps ?? []).map(step => step.equipment?.name).filter(Boolean),
		),
	];
}
