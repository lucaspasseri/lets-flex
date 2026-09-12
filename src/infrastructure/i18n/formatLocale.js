import { isValid, parseISO } from "date-fns";

/** @typedef {Intl.DateTimeFormatOptions} DateFormatOptions */
/** @typedef {Intl.NumberFormatOptions} NumberFormatOptions */

/** @param {unknown} value */
function toDate(value) {
	if (value instanceof Date) return value;
	if (typeof value !== "string" || value.trim() === "") return null;
	const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
		? new Date(`${value}T00:00:00.000Z`)
		: parseISO(value);
	return isValid(date) ? date : null;
}

/**
 * Formats a date at the presentation boundary. Date-only strings are anchored
 * to UTC so the stored calendar day cannot shift with the server timezone.
 *
 * @param {string | Date | null | undefined} value
 * @param {string} [language]
 * @param {DateFormatOptions} [options]
 * @returns {string | null}
 */
export function formatLocaleDate(value, language = "en", options = {}) {
	const date = toDate(value);
	const usesDateComponents = [
		"weekday",
		"era",
		"year",
		"month",
		"day",
		"dayPeriod",
		"hour",
		"minute",
		"second",
	].some((key) => key in options);
	return date
		? new Intl.DateTimeFormat(language, {
				...(usesDateComponents || options.dateStyle || options.timeStyle
					? {}
					: { dateStyle: "medium" }),
				timeZone: "UTC",
				...options,
			}).format(date)
		: null;
}

/**
 * @param {number | bigint | null | undefined} value
 * @param {string} [language]
 * @param {NumberFormatOptions} [options]
 */
export function formatLocaleNumber(value, language = "en", options = {}) {
	if (value === null || value === undefined || typeof value === "boolean") {
		return "";
	}
	return new Intl.NumberFormat(language, options).format(value);
}

/** @param {number} value @param {string} [language] */
export function formatLocalePercent(value, language = "en") {
	return new Intl.NumberFormat(language, {
		style: "percent",
		maximumFractionDigits: 0,
	}).format(value / 100);
}

const measurementUnits = Object.freeze({
	Kilograms: "kilogram",
	Pounds: "pound",
	Libra: "pound",
});

/** @param {string} unit */
export function formatMeasurementSymbol(unit) {
	return (
		{
			Kilograms: "kg",
			Pounds: "lb",
			Libra: "lb",
		}[unit] ?? unit
	);
}

/**
 * Formats a measurement with a localized long unit while retaining the
 * persisted unit identifier at the caller boundary.
 *
 * @param {number} value
 * @param {string} unit
 * @param {string} [language]
 */
export function formatLocaleMeasurement(value, unit, language = "en") {
	const intlUnit = measurementUnits[unit] ?? unit;
	try {
		return new Intl.NumberFormat(language, {
			maximumFractionDigits: 2,
			style: "unit",
			unit: intlUnit,
			unitDisplay: "long",
		}).format(value);
	} catch {
		return `${formatLocaleNumber(value, language, { maximumFractionDigits: 2 })} ${unit}`;
	}
}

/** @param {number} value @param {"minute" | "second" | "hour"} unit @param {string} [language] */
export function formatLocaleDuration(value, unit = "minute", language = "en") {
	return new Intl.NumberFormat(language, {
		style: "unit",
		unit,
		unitDisplay: "long",
	}).format(value);
}
