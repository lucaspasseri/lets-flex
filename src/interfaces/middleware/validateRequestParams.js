import { formatValidationErrors } from "./validateRequestBody.js";

/**
 * Middleware that validates route parameters and exposes parsed schema fields.
 *
 * @param {import("zod").ZodType} schema
 * @returns {import("express").RequestHandler}
 */
export default function validateRequestParams(schema) {
	return function validate(req, res, next) {
		const result = schema.safeParse(req.params);

		if (!result.success) {
			res.status(400).json({
				error: "Invalid route parameters.",
				...formatValidationErrors(result.error),
			});
			return;
		}

		// @ts-ignore -- populated for downstream controllers.
		req.validatedParams = result.data;
		next();
	};
}
