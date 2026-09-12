/**
 * @typedef {import("zod").ZodType} ZodType
 * @typedef {import("zod").ZodError} ZodError
 * @typedef {import("express").RequestHandler} RequestHandler
 * @typedef {{fieldErrors: Record<string, string>, formErrors: string[]}} ValidationErrors
 * @typedef {{errors: ValidationErrors, submittedValues: unknown}} InvalidBodyResult
 * @typedef {(req: import("express").Request, res: import("express").Response, result: InvalidBodyResult) => unknown | Promise<unknown>} InvalidBodyHandler
 */

/**
 * Converts Zod issues into a predictable structure for rendering.
 * Only the first message for each field is exposed to the form.
 *
 * @param {ZodError} error
 * @returns {ValidationErrors}
 */
/** @param {ZodError} error @param {Function} [translate] */
export function formatValidationErrors(error, translate) {
	return formatValidationErrorsForLocale(error, translate);
}

const VALIDATION_KEYS = new Map([
	["Choose a valid workout session.", "validation.validWorkoutSession"],
	["Choose a valid workout step.", "validation.validWorkoutStep"],
	["Choose a valid load unit.", "validation.validLoadUnit"],
	["Add at least one set.", "validation.atLeastOneSet"],
	["A step cannot contain more than 100 sets.", "validation.maximumWorkoutSets"],
	["Choose a valid exercise.", "validation.validExercise"],
	["Choose a valid result limit.", "validation.validResultLimit"],
	["Choose a valid start date.", "validation.validStartDate"],
	["Choose a valid end date.", "validation.validEndDate"],
	[
		"The start date must be on or before the end date.",
		"validation.startDateBeforeEndDate",
	],
]);

/** @param {ZodError} error @param {Function} [translate] @returns {ValidationErrors} */
function formatValidationErrorsForLocale(error, translate) {
	/** @type {Record<string, string>} */
	const fieldErrors = {};
	/** @type {string[]} */
	const formErrors = [];

	for (const issue of error.issues) {
		const fieldName = issue.path.map(String).join(".");
		const key = VALIDATION_KEYS.get(issue.message);
		const message =
			key && typeof translate === "function"
				? translate(key, { defaultValue: issue.message })
				: issue.message;

		if (fieldName) {
			fieldErrors[fieldName] ??= message;
		} else {
			formErrors.push(message);
		}
	}

	return { fieldErrors, formErrors };
}

/**
 * Validates an HTTP body without knowing which page or feature owns it.
 * The supplied callback owns the invalid response.
 *
 * @param {ZodType} schema
 * @param {InvalidBodyHandler} onInvalid
 * @returns {RequestHandler}
 */
export default function validateRequestBody(schema, onInvalid) {
	return async function validate(req, res, next) {
		const result = schema.safeParse(req.body);

		if (!result.success) {
			try {
				await onInvalid(req, res, {
					errors: formatValidationErrorsForLocale(result.error, res.locals?.t),
					submittedValues: req.body,
				});
			} catch (error) {
				next(error);
			}

			return;
		}

		// @ts-ignore -- populated by this middleware for downstream controllers.
		req.validatedBody = result.data;
		next();
	};
}
