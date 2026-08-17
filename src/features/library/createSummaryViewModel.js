import {
	getDistinctEquipments,
	getDistinctMovements,
	getDistinctMuscles,
} from "./selectors/sessionSelectors.js";

/**
 * @typedef {import("../sessions/sessions.types.js").SessionMapper} SessionMapper
 * @typedef {import("../sessions/sessions.types.js").SummaryViewModel} SummaryViewModel
 */

/**
 * @typedef {object} CreateSummaryInput
 * @property {SessionMapper} session
 * @property {SessionMapper["id"] | null} activeSessionId
 */

/**
 * @param {CreateSummaryInput} input
 * @returns {SummaryViewModel}
 */

function createSummary({ session, activeSessionId }) {
	const steps = session.steps ?? [];
	const movements = getDistinctMovements(session);
	const muscles = getDistinctMuscles(session);
	const equipments = getDistinctEquipments(session);

	const setCount = steps.reduce((total, step) => total + (step.sets ?? 0), 0);

	const searchKeyWord = [session.name, ...movements, ...muscles]
		.filter(Boolean)
		.join(" ");

	return {
		id: session.id,
		name: session.name,
		href: `/library?sessionId=${session.id}`,
		isCurrent: session.id === activeSessionId,
		description: session.notes ?? "Remember, safety first.",
		stepCountLabel: `${steps.length} exercises`,
		setCountLabel: `${setCount} sets`,
		movementPatternsLabel:
			movements.length > 0 ? movements.join(", ") : "No movement pattern",
		musclesLabel: muscles.length > 0 ? muscles.join(", ") : "No muscle",
		equipmentsLabel:
			equipments.length > 0 ? equipments.join(", ") : "No equipment",
		searchKeyWord,
	};
}

export default createSummary;
