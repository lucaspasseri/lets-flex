import {
	getDistinctMovements,
	getDistinctEquipments,
} from "./selectors/sessionSelectors.js";

function createDetails({ session }) {
	if (!session) {
		return {};
	}
	const steps = session.steps ?? [];
	const setCount = steps.reduce((total, step) => total + step.sets, 0);
	const movements = getDistinctMovements(session);
	const equipments = getDistinctEquipments(session);

	return {
		id: session.id,
		headingId: `session-details-title-${session.id}`,
		name: session.name,
		description: session.description ?? "Remember, safety first.",
		notes: session.notes,
		isArchived: session.isArchived,

		stats: [
			{
				label: "Exercises",
				value: steps.length,
				icon: "dumbbell",
			},
			{
				label: "Working sets",
				value: setCount,
				icon: "layers",
			},
			{
				label: "Movement patterns",
				// value:
				// 	movements.length > 0 ? movements.join(", ") : "No movement patterns",
				value: movements.length,
				icon: "activity",
			},
			{
				label: "Equipment",
				// value: equipments.length > 0 ? equipments.join(", ") : "No equipment",
				value: equipments.length,
				icon: "wrench",
			},
		],

		stepNumber: steps.length,
		steps: steps.map(createStepViewModel),

		actions: {
			edit: {
				label: "Edit session",
				href: `/sessions/${session.id}/edit`,
			},
			archive: {
				label: "Archive session",
				action: `/sessions/${session.id}/archive`,
			},
		},
	};
}

function createStepViewModel(step) {
	return {
		id: step.id,
		order: step.order,
		type: step.type,

		exercise: {
			name: step.exercise.name,
			variantName: step.exercise.variantName,
			movementPattern: step.movementPattern,
			equipment: step.equipment.name,
		},

		prescription: {
			sets: step.sets,
			reps: step.reps,
			loadValue: step.loadValue,
			loadUnit: step.loadUnit,
		},

		setupDescription: step.setupDescription ?? "-",

		notes: step.notes ?? "-",

		muscles: step.muscles ?? [],
	};
}

export default createDetails;
