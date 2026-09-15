function sanitizePrefix(value) {
	const prefix = String(value).trim();
	return /^[A-Za-z_][A-Za-z0-9_-]*$/.test(prefix) ? prefix : "";
}

function sanitizeIdentifier(value) {
	const identifier = String(value).trim();
	if (!identifier) return "";
	if (/^\d+$/.test(identifier)) return identifier;

	return `x${identifier.length}-${Array.from(identifier)
		.map((character) => (character.codePointAt(0) ?? 0).toString(16).padStart(4, "0"))
		.join("")}`;
}

/**
 * Create a CSS-safe, stable View Transition name from a controlled prefix and entity identifier.
 * @param {string} prefix
 * @param {string | number | null | undefined} identifier
 * @returns {string | null}
 */
export default function createViewTransitionName(prefix, identifier) {
	const safePrefix = sanitizePrefix(prefix);
	const safeIdentifier =
		identifier === null || identifier === undefined
			? ""
			: sanitizeIdentifier(identifier);

	if (!/^[A-Za-z_]/.test(safePrefix) || !safeIdentifier) return null;

	return `${safePrefix}-${safeIdentifier}`;
}
