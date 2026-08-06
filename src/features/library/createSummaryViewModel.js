import {
	getDistinctMovements,
	getDistinctMuscles,
} from "./selectors/sessionSelectors.js";

function createSummary({ session, activeSessionId }) {
	const steps = session.steps ?? [];
	const movements = getDistinctMovements(session);
	const muscles = getDistinctMuscles(session);

	const setCount = steps.reduce((total, step) => total + (step.sets ?? 0), 0);

	return {
		id: session.id,
		name: session.name,
		href: `/library?sessionId=${session.id}`,
		isCurrent: session.id === activeSessionId,
		description: session.description ?? "Remember, safety first.",
		stepCountLabel: `${steps.length} exercises`,
		setCountLabel: `${setCount} sets`,
		movementPatternsLabel:
			movements.length > 0 ? movements.join(", ") : "No movement patterns",
		searchKeywords: [session.name, ...movements, ...muscles]
			.filter(Boolean)
			.join(" "),
	};
}

export default createSummary;
