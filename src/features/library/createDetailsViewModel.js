import {
	getDistinctMovements,
	getDistinctEquipments,
} from "./selectors/sessionSelectors.js";
import createDetailsStepViewModel from "./createDetailsStepViewModel.js";
import { resolveMedia } from "../media/resolveMedia.js";
import translateCount from "../../infrastructure/i18n/translateCount.js";
import translateMessage from "../../infrastructure/i18n/translateMessage.js";

/**
 * @typedef {import("../sessions/sessions.types.js").SessionMapper} SessionMapper
 * @typedef {import("../sessions/sessions.types.js").SessionMapperStep} SessionMapperStep
 * @typedef {import("../sessions/sessions.types.js").DetailsViewModel} DetailsViewModel
 */

/**
 * @typedef {object} CreateDetailsInput
 * @property { SessionMapper | null} session
 * @property {number | null} [actorUserId]
 * @property {string} [language]
 * @property {Function} [translate]
 */

/**
 * @param {CreateDetailsInput} input
 * @returns {DetailsViewModel | null}
 */

function createDetails({ session, actorUserId = null, language = "en", translate }) {
	if (!session) {
		return null;
	}
	const t = (key, options = {}) =>
		translateMessage(translate, key, String(options.defaultValue ?? ""), options);
	const steps = session.steps ?? [];
	const stepCount = steps.length;
	const setCount = steps.reduce((total, step) => total + step.sets, 0);
	const movements = getDistinctMovements(session);
	const equipments = getDistinctEquipments(session);

	const detailSteps = steps.map((step) =>
		createDetailsStepViewModel(step, language, translate),
	);

	return {
		id: session.id,
		headingId: `session-details-title-${session.id}`,
		name: session.name,
		description: t("library.safetyReminder", {
			defaultValue: "Remember, safety first.",
		}),
		notes: session.notes,
		isArchived: session.isArchived,

		stepNumber: stepCount,
		stepCountLabel: translateCount(translate, "library.exerciseCount", stepCount, {
			one: "{{count}} exercise",
			other: "{{count}} exercises",
		}),
		media: steps[0]
			? resolveMedia({
					entityType: "session",
					label: session.name,
					presentation: "initial",
				})
			: null,
		steps: detailSteps,

		stats: [
			{
				label: t("library.exercises", { defaultValue: "Exercises" }),
				value: stepCount,
				icon: "dumbbell",
			},
			{
				label: t("library.workingSets", { defaultValue: "Working sets" }),
				value: setCount,
				icon: "layers",
			},
			{
				label: t("library.movementPatterns", { defaultValue: "Movement patterns" }),
				value: movements.length,
				icon: "activity",
			},
			{
				label: t("library.equipment", { defaultValue: "Equipment" }),
				value: equipments.length,
				icon: "wrench",
			},
		],

		actions:
			session.ownerUserId === actorUserId
				? {
						edit: {
							label: t("library.editSession", { defaultValue: "Edit session" }),
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
						delete: session.isArchived
							? null
							: {
									label: t("library.deleteSession", { defaultValue: "Delete session" }),
									modalId: "deleteSessionModal",
									values: { sessionId: session.id, name: session.name },
								},
					}
				: { edit: null, delete: null },
	};
}

export default createDetails;
