/**
 * Formats an internal underscore-delimited goal name for presentation.
 *
 * @param {unknown} value
 * @returns {string}
 */
export default function formatGoalLabel(value) {
	if (typeof value !== "string") return "";

	return value
		.trim()
		.split(/_+/u)
		.map((word) => word.trim())
		.filter(Boolean)
		.map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}
