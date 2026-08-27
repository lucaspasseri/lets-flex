import { formatValidationErrors } from "./validateRequestBody.js";

/**
 * Middleware that sanitizes an HTTP query object, storing only schema-defined,
 * parsed values for downstream handlers.
 *
 * @param {import("zod").ZodType} schema
 * @returns {import("express").RequestHandler}
 */
export default function validateRequestQuery(schema) {
	return function validate(req, res, next) {
		const result = schema.safeParse(req.query);

		if (!result.success) {
			res.status(400).json({
				error: "Invalid query parameters.",
				...formatValidationErrors(result.error),
			});
			return;
		}

		// @ts-ignore -- populated for downstream controllers.
		req.validatedQuery = result.data;
		next();
	};
}
