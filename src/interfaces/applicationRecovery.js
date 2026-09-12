import translateMessage from "../infrastructure/i18n/translateMessage.js";

const RECOVERY_STATES = Object.freeze({
	notFound: {
		status: 404,
		eyebrow: "Page not found",
		title: "That page isn't here",
		message: "The link may be outdated or the address may be incorrect.",
		actionLabel: "Return to dashboard",
		actionHref: "/",
		fallbackMessage: "Not found",
	},
	server: {
		status: 500,
		eyebrow: "Temporary problem",
		title: "Let's try that again",
		message: "We couldn't complete the request. Please try again in a moment.",
		actionLabel: "Return to dashboard",
		actionHref: "/",
		fallbackMessage: "Something broke!",
	},
	authentication: {
		status: 401,
		eyebrow: "Sign-in required",
		title: "Please sign in to continue",
		message: "This area is available after you sign in to your account.",
		actionLabel: "Go to sign in",
		actionHref: "/auth/login",
		fallbackMessage: "Authentication required",
	},
	forbidden: {
		status: 403,
		eyebrow: "Access limited",
		title: "You don't have access to this page",
		message: "Your account can't open this area.",
		actionLabel: "Return to dashboard",
		actionHref: "/",
		fallbackMessage: "Forbidden",
	},
	csrf: {
		status: 403,
		eyebrow: "Request not verified",
		title: "We couldn't verify that request",
		message: "Please return to the page and try again.",
		actionLabel: "Return to dashboard",
		actionHref: "/",
		fallbackMessage: "Invalid CSRF token",
	},
	rateLimit: {
		status: 429,
		eyebrow: "Please wait",
		title: "Too many requests",
		message: "Please wait a little while before trying again.",
		actionLabel: "Return to sign in",
		actionHref: "/auth/login",
		fallbackMessage: "Too many requests. Try again later.",
	},
});

const RECOVERY_KEYS = Object.freeze({
	notFound: {
		eyebrow: "recovery.pageNotFound",
		title: "recovery.pageNotFoundTitle",
		message: "recovery.pageNotFoundMessage",
		actionLabel: "recovery.returnToDashboard",
		fallbackMessage: "recovery.notFound",
	},
	server: {
		eyebrow: "recovery.temporaryProblem",
		title: "recovery.temporaryProblemTitle",
		message: "recovery.temporaryProblemMessage",
		actionLabel: "recovery.returnToDashboard",
		fallbackMessage: "recovery.somethingBroke",
	},
	authentication: {
		eyebrow: "recovery.signInRequired",
		title: "recovery.signInRequiredTitle",
		message: "recovery.signInRequiredMessage",
		actionLabel: "recovery.returnToSignIn",
		fallbackMessage: "recovery.authenticationRequired",
	},
	forbidden: {
		eyebrow: "recovery.accessLimited",
		title: "recovery.accessLimitedTitle",
		message: "recovery.accessLimitedMessage",
		actionLabel: "recovery.returnToDashboard",
		fallbackMessage: "recovery.forbidden",
	},
	csrf: {
		eyebrow: "recovery.requestNotVerified",
		title: "recovery.requestNotVerifiedTitle",
		message: "recovery.requestNotVerifiedMessage",
		actionLabel: "recovery.returnToDashboard",
		fallbackMessage: "recovery.invalidCsrfToken",
	},
	rateLimit: {
		eyebrow: "recovery.pleaseWait",
		title: "recovery.tooManyRequests",
		message: "recovery.tooManyRequestsMessage",
		actionLabel: "recovery.returnToSignIn",
		fallbackMessage: "recovery.tooManyRequestsFallback",
	},
});

function localizeRecoveryState(state, kind, translate) {
	const keys = RECOVERY_KEYS[kind] ?? RECOVERY_KEYS.server;
	return {
		...state,
		eyebrow: translateMessage(translate, keys.eyebrow, state.eyebrow),
		title: translateMessage(translate, keys.title, state.title),
		message: translateMessage(translate, keys.message, state.message),
		actionLabel: translateMessage(translate, keys.actionLabel, state.actionLabel),
		fallbackMessage: translateMessage(
			translate,
			keys.fallbackMessage,
			state.fallbackMessage,
		),
	};
}

/** @param {import("express").Request} req */
export function acceptsJson(req) {
	const accept = String(req.get?.("accept") ?? "").toLowerCase();
	return (
		Boolean(req.is?.("json")) ||
		(accept.includes("application/json") && !accept.includes("text/html"))
	);
}

/** @param {import("express").Request} req */
export function acceptsHtml(req) {
	const accept = String(req.get?.("accept") ?? "").toLowerCase();
	return accept.includes("text/html") && !acceptsJson(req);
}

/**
 * Responds with the application recovery surface for HTML requests and keeps
 * non-HTML callers on a text or JSON response contract.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {{kind: keyof typeof RECOVERY_STATES, actionHref?: string}} options
 */
export function respondWithApplicationRecovery(req, res, { kind, actionHref }) {
	const state = RECOVERY_STATES[kind] ?? RECOVERY_STATES.server;
	const recoveryState = localizeRecoveryState(state, kind, res.locals?.t);
	const recovery = actionHref ? { ...recoveryState, actionHref } : recoveryState;

	if (acceptsHtml(req)) {
		res.status(recovery.status).render("application-recovery", {
			layout: "./layouts/recoveryShell",
			page: { title: `${recovery.title} · Let's Flex!` },
			recovery,
		});
		return;
	}

	if (acceptsJson(req)) {
		res.status(recovery.status).json({ error: recovery.fallbackMessage });
		return;
	}

	res.status(recovery.status).send(recovery.fallbackMessage);
}

export { RECOVERY_STATES };
