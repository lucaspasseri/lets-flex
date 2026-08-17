/**
 * @param {string | null | undefined} string
 * @returns {string}
 */

function toCapitalizedString(string) {
	if (typeof string !== "string" || string.length === 0) {
		return "";
	}

	return string[0].toUpperCase() + string.substring(1);
}

export default toCapitalizedString;
