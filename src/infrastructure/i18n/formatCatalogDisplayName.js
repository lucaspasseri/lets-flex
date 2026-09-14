/**
 * @param {string | null | undefined} canonicalName
 * @param {string | null | undefined} localizedName
 * @param {string} [language]
 * @returns {string}
 */
export default function formatCatalogDisplayName(
	canonicalName,
	localizedName,
	language = "en",
) {
	const canonical = typeof canonicalName === "string" ? canonicalName.trim() : "";
	const localized = typeof localizedName === "string" ? localizedName.trim() : "";
	if (!canonical) return localized;
	if (language !== "pt-BR" || !localized) return canonical;

	const normalize = (value) => value.replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
	if (normalize(canonical) === normalize(localized)) return canonical;
	return `${canonical} (${localized})`;
}
