import { acceptsHtml, acceptsJson } from "./applicationRecovery.js";

/**
 * Renders a page-bound mutation failure for HTML callers while retaining the
 * existing plain and JSON response contracts for other callers.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {{status: number, fallbackMessage: string, render: () => unknown | Promise<unknown>}} options
 * @returns {Promise<boolean>}
 */
export default async function respondWithContextualMutationError(
	req,
	res,
	{ status, fallbackMessage, render },
) {
	if (acceptsHtml(req)) {
		res.status(status);
		await render();
		return true;
	}

	if (acceptsJson(req)) {
		res.status(status).json({ error: fallbackMessage });
		return true;
	}

	res.status(status).send(fallbackMessage);
	return true;
}
