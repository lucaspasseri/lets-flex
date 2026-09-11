import {
	getDistinctEquipments,
	getDistinctMovements,
	getDistinctMuscles,
} from "./selectors/sessionSelectors.js";
import resolveLibraryStepMedia from "./resolveLibraryStepMedia.js";

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
	const media = steps[0] ? resolveLibraryStepMedia(steps[0]) : null;
	const movements = getDistinctMovements(session);
	const muscles = getDistinctMuscles(session);
	const equipments = getDistinctEquipments(session);
	const filterEquipments = [
		...new Set(
			steps.map((step) => step.equipment?.name ?? "Bodyweight").filter(Boolean),
		),
	];

	const setCount = steps.reduce((total, step) => total + (step.sets ?? 0), 0);

	const searchKeyWord = [
		session.name,
		session.notes,
		...steps.flatMap((step) => [
			step.name,
			step.type,
			step.exercise?.name,
			step.exercise?.variantName,
			step.exercise?.setupDescription,
			step.exercise?.environment,
			step.exercise?.notes,
			step.movementPattern,
			step.equipment?.name ?? "Bodyweight",
			step.equipment?.category,
			...(step.muscles ?? []).flatMap((muscle) => [
				muscle.commonName,
				muscle.scientificName,
				muscle.bodyPart,
			]),
		]),
	]
		.filter(Boolean)
		.join(" ");

	return {
		id: session.id,
		name: session.name,
		href: `/library?sessionId=${session.id}`,
		isCurrent: session.id === activeSessionId,
		media,
		description: session.notes ?? "Remember, safety first.",
		stepCountLabel: `${steps.length} exercises`,
		setCountLabel: `${setCount} sets`,
		movementPatternsLabel:
			movements.length > 0 ? movements.join(", ") : "No movement pattern",
		musclesLabel: muscles.length > 0 ? muscles.join(", ") : "No muscle",
		equipmentsLabel: equipments.length > 0 ? equipments.join(", ") : "No equipment",
		searchKeyWord,
		filters: {
			movement: movements,
			muscle: muscles,
			equipment: filterEquipments,
		},
	};
}

export default createSummary;
