import { z } from "zod";

/**
 * Builds a required string schema that safely rejects non-string HTTP values
 * and trims surrounding whitespace before applying later constraints.
 *
 * @param {string} message
 */
const requiredTrimmedString = message =>
	z.preprocess(
		value => (typeof value === "string" ? value : ""),
		z.string().trim().min(1, message),
	);

/**
 * @param {string} value
 * @returns {boolean}
 */
function isCalendarDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));

	return (
		date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day
	);
}

/**
 * Compares ISO date strings in local calendar time so "today" follows the
 * application's user-facing date rather than UTC.
 *
 * @param {string} value
 * @returns {boolean}
 */
function isNotInFuture(value) {
	const today = new Date();
	const todayString = [
		today.getFullYear(),
		String(today.getMonth() + 1).padStart(2, "0"),
		String(today.getDate()).padStart(2, "0"),
	].join("-");

	return value <= todayString;
}

/**
 * HTTP-boundary schema for profile creation. Its output deliberately matches
 * CreateUserInput so the successful controller needs no request-field mapping.
 */
export const createUserSchema = z
	.object({
		name: requiredTrimmedString("Enter a name.").pipe(
			z.string().max(100, "Name must be 100 characters or fewer."),
		),
		dob: requiredTrimmedString("Enter a date of birth.")
			.refine(isCalendarDate, "Enter a valid date of birth.")
			.refine(isNotInFuture, "Date of birth cannot be in the future."),
		anamnesis: z
			.preprocess(
				value => (typeof value === "string" ? value : ""),
				z
					.string()
					.trim()
					.max(1000, "Health notes must be 1000 characters or fewer."),
			)
			.transform(value => value || null),
	})
	.transform(({ name, dob, anamnesis }) => ({
		name,
		dateOfBirth: dob,
		anamnesis,
	}));

/**
 * @typedef {z.input<typeof createUserSchema>} CreateUserRequestBody
 * @typedef {z.output<typeof createUserSchema>} ValidatedCreateUserBody
 */
