import {
	getDistinctMovements,
	getDistinctEquipments,
} from "./selectors/sessionSelectors.js";
import createDetailsStepViewModel from "./createDetailsStepViewModel.js";

/**
 * @typedef {import("../sessions/sessions.types.js").SessionMapper} SessionMapper
 * @typedef {import("../sessions/sessions.types.js").SessionMapperStep} SessionMapperStep
 * @typedef {import("../sessions/sessions.types.js").DetailsViewModel} DetailsViewModel
 */

/**
 * @typedef {object} CreateDetailsInput
 * @property { SessionMapper | null} session
 * @property {number | null} [actorUserId]
 */

/**
 * @param {CreateDetailsInput} input
 * @returns {DetailsViewModel | null}
 */

function createDetails({ session, actorUserId = null }) {
	if (!session) {
		return null;
	}
	const steps = session.steps ?? [];
	const stepCount = steps.length;
	const setCount = steps.reduce((total, step) => total + step.sets, 0);
	const movements = getDistinctMovements(session);
	const equipments = getDistinctEquipments(session);

	return {
		id: session.id,
		headingId: `session-details-title-${session.id}`,
		name: session.name,
		description: "Remember, safety first.",
		notes: session.notes,
		isArchived: session.isArchived,

		stepNumber: stepCount,
		steps: steps.map(createDetailsStepViewModel),

		stats: [
			{
				label: "Exercises",
				value: stepCount,
				icon: "dumbbell",
			},
			{
				label: "Working sets",
				value: setCount,
				icon: "layers",
			},
			{
				label: "Movement patterns",
				value: movements.length,
				icon: "activity",
			},
			{
				label: "Equipment",
				value: equipments.length,
				icon: "wrench",
			},
		],

		actions:
			session.ownerUserId === actorUserId
				? {
						edit: {
							label: "Edit session",
							modalId: "updateSessionModal",
							values: {
								sessionId: session.id,
								name: session.name,
								notes: session.notes ?? "",
								stepRow: steps.map((step) => ({
									stepId: step.id,
									stepTypeId: step.stepTypeId,
									exerciseVariantId: step.exerciseVariantId,
									sets: step.sets,
									reps: step.reps,
									loadValue: step.loadValue,
									loadUnit: step.loadUnit,
								})),
							},
						},
						archive: session.isArchived
							? null
							: {
									label: "Archive session",
									modalId: "archiveSessionModal",
									values: { sessionId: session.id, name: session.name },
								},
					}
				: { edit: null, archive: null },
	};
}

export default createDetails;
