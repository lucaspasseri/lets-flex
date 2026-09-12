import { acceptsHtml, acceptsJson } from "./applicationRecovery.js";
import translateMessage from "../infrastructure/i18n/translateMessage.js";

/**
 * Renders a page-bound mutation failure for HTML callers while retaining the
 * existing plain and JSON response contracts for other callers.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {{status: number, fallbackMessage: string, fallbackKey?: string, fallbackValues?: Record<string, unknown>, render: () => unknown | Promise<unknown>}} options
 * @returns {Promise<boolean>}
 */
export default async function respondWithContextualMutationError(
	req,
	res,
	{ status, fallbackMessage, fallbackKey, fallbackValues, render },
) {
	const localizedFallback = fallbackKey
		? translateMessage(res.locals?.t, fallbackKey, fallbackMessage, fallbackValues)
		: fallbackMessage;
	if (acceptsHtml(req)) {
		res.status(status);
		await render();
		return true;
	}

	if (acceptsJson(req)) {
		res.status(status).json({ error: localizedFallback });
		return true;
	}

	res.status(status).send(localizedFallback);
	return true;
}
