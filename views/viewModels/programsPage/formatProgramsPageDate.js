import { format, isValid, parseISO } from "date-fns";

/** @param {string | Date | null} value */
export default function formatProgramsPageDate(value) {
	if (!value) return null;

	const date = value instanceof Date ? value : parseISO(value);

	return isValid(date) ? format(date, "dd/MM") : null;
}
