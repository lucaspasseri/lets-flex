import { formatLocaleDate } from "../../../src/infrastructure/i18n/formatLocale.js";

/** @param {string | Date | null} value @param {string} [language] */
export default function formatDayPageDate(value, language = "en") {
	return formatLocaleDate(value, language, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}
