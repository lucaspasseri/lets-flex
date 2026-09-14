/**
 * Formats an internal underscore-delimited goal name for presentation.
 *
 * @param {unknown} value
 * @param {Function} [translate]
 * @returns {string}
 */
export default function formatGoalLabel(value, translate) {
	if (typeof value !== "string") return "";

	const normalized = value.trim().toLowerCase();
	const label = value
		.trim()
		.split(/_+/u)
		.map((word) => word.trim())
		.filter(Boolean)
		.map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
	const translationKey = {
		hypertrophy: "programs.goalOptions.hypertrophy",
		strength: "programs.goalOptions.strength",
		weight_loss: "programs.goalOptions.weightLoss",
		conditioning: "programs.goalOptions.conditioning",
		mobility: "programs.goalOptions.mobility",
		rehabilitation: "programs.goalOptions.rehabilitation",
		general_fitness: "programs.goalOptions.generalFitness",
	}[normalized];

	return translationKey && typeof translate === "function"
		? translate(translationKey, { defaultValue: label })
		: label;
}
