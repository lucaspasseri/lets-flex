/**
 * Reads the small, server-rendered message contract used by browser enhancements.
 * The message templates originate from the application's i18next translator; this
 * helper only selects plural variants and interpolates values at interaction time.
 */
/** @param {Document | HTMLElement | any} [root] @param {Record<string, any>} [fallbacks] */
export function createBrowserTranslator(root = document, fallbacks = {}) {
	const ownerDocument = "ownerDocument" in root ? root.ownerDocument : root;
	const element =
		root.querySelector?.("[data-i18n-messages]") ??
		ownerDocument?.querySelector?.("[data-i18n-messages]");
	let messages = {};
	if (element?.textContent) {
		try {
			messages = JSON.parse(element.textContent);
		} catch {
			messages = {};
		}
	}

	return (key, values = {}) => {
		const read = (source) =>
			key.split(".").reduce((value, part) => value?.[part], source);
		const entry = read(messages) ?? read(fallbacks);
		const template =
			entry && typeof entry === "object"
				? entry[Number(values.count) === 1 ? "one" : "other"]
				: entry;
		if (typeof template !== "string") return key;
		return template.replace(/\{\{(\w+)\}\}/g, (_match, name) =>
			String(values[name] ?? `{{${name}}}`),
		);
	};
}
