import {
	getDistinctEquipments,
	getDistinctMovements,
	getDistinctMuscles,
} from "./selectors/sessionSelectors.js";
import resolveLibraryStepMedia from "./resolveLibraryStepMedia.js";
import { resolveMedia } from "../media/resolveMedia.js";
import translateCount from "../../infrastructure/i18n/translateCount.js";
import translateMessage from "../../infrastructure/i18n/translateMessage.js";

/**
 * @typedef {import("../sessions/sessions.types.js").SessionMapper} SessionMapper
 * @typedef {import("../sessions/sessions.types.js").SummaryViewModel} SummaryViewModel
 */

/**
 * @typedef {object} CreateSummaryInput
 * @property {SessionMapper} session
 * @property {SessionMapper["id"] | null} activeSessionId
 * @property {Function} [mediaResolver]
 * @property {Function} [translate]
 */

/**
 * @param {CreateSummaryInput} input
 * @returns {SummaryViewModel}
 */

function createSummary({ session, activeSessionId, mediaResolver, translate }) {
	const t = (key, options = {}) =>
		translateMessage(translate, key, String(options.defaultValue ?? ""), options);
	const steps = session.steps ?? [];
	const firstExerciseMedia = steps[0]
		? resolveLibraryStepMedia(steps[0], { resolveMedia: mediaResolver })
		: null;
	const media = firstExerciseMedia?.src
		? firstExerciseMedia
		: steps[0]
			? resolveMedia({
					entityType: "session",
					label: session.name,
					presentation: "initial",
				})
			: null;
	const movements = getDistinctMovements(session);
	const muscles = getDistinctMuscles(session);
	const equipments = getDistinctEquipments(session);
	const bodyweightLabel = t("library.bodyweight", { defaultValue: "Bodyweight" });
	const filterEquipments = [
		...new Set(
			steps.map((step) => step.equipment?.name ?? bodyweightLabel).filter(Boolean),
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
			step.exercise?.canonicalName,
			step.exercise?.variantName,
			step.exercise?.canonicalVariantName,
			step.exercise?.setupDescription,
			step.exercise?.environment,
			step.exercise?.notes,
			step.movementPattern,
			step.canonicalMovementPattern,
			step.equipment?.name ?? bodyweightLabel,
			step.equipment?.canonicalName,
			step.equipment?.category,
			...(step.muscles ?? []).flatMap((muscle) => [
				muscle.commonName,
				muscle.canonicalCommonName,
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
		description:
			session.notes ??
			t("library.safetyReminder", { defaultValue: "Remember, safety first." }),
		stepCountLabel: translateCount(translate, "library.exerciseCount", steps.length, {
			one: "{{count}} exercise",
			other: "{{count}} exercises",
		}),
		setCountLabel: translateCount(translate, "library.setCount", setCount, {
			one: "{{count}} set",
			other: "{{count}} sets",
		}),
		movementPatternsLabel:
			movements.length > 0
				? movements.join(", ")
				: t("library.noMovementPattern", { defaultValue: "No movement pattern" }),
		musclesLabel:
			muscles.length > 0
				? muscles.join(", ")
				: t("library.noMuscle", { defaultValue: "No muscle" }),
		equipmentsLabel:
			equipments.length > 0
				? equipments.join(", ")
				: t("library.noEquipment", { defaultValue: "No equipment" }),
		searchKeyWord,
		filters: {
			movement: movements,
			muscle: muscles,
			equipment: filterEquipments,
		},
	};
}

export default createSummary;
