/**
 * @typedef {import("zod").ZodType} ZodType
 * @typedef {import("zod").ZodError} ZodError
 * @typedef {import("express").RequestHandler} RequestHandler
 * @typedef {{fieldErrors: Record<string, string>, formErrors: string[]}} ValidationErrors
 * @typedef {{errors: ValidationErrors, submittedValues: unknown}} InvalidBodyResult
 * @typedef {(req: import("express").Request, res: import("express").Response, result: InvalidBodyResult) => unknown | Promise<unknown>} InvalidBodyHandler
 */

/**
 * Converts Zod issues into a small, predictable structure for rendering.
 * Only the first message for each field is exposed to the form.
 *
 * @param {ZodError} error
 * @returns {ValidationErrors}
 */
export function formatValidationErrors(error) {
	/** @type {Record<string, string>} */
	const fieldErrors = {};
	/** @type {string[]} */
	const formErrors = [];

	for (const issue of error.issues) {
		const fieldName = issue.path[0];

		if (typeof fieldName === "string") {
			fieldErrors[fieldName] ??= issue.message;
		} else {
			formErrors.push(issue.message);
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
					errors: formatValidationErrors(result.error),
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
