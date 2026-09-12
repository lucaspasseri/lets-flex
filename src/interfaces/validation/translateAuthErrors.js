import translateMessage from "../../infrastructure/i18n/translateMessage.js";

const AUTH_VALIDATION_KEYS = new Map([
	["Enter a valid email address.", "auth.validEmail"],
	["Enter your password.", "auth.passwordRequired"],
	["Password must contain at least 12 characters.", "auth.passwordMinimum"],
	["Password is too long.", "auth.passwordTooLong"],
	["Passwords must match.", "auth.passwordsMatch"],
]);

/** @param {import("express").Response} res @param {Array<{message: string}>} issues */
export default function translateAuthErrors(res, issues) {
	return issues.map((issue) => {
		const key = AUTH_VALIDATION_KEYS.get(issue.message);
		return key ? translateMessage(res.locals?.t, key, issue.message) : issue.message;
	});
}
