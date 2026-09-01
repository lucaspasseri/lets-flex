/** @param {unknown} value */
export default function normalizeEmail(value) {
	return typeof value === "string" ? value.trim().toLowerCase() : "";
}
