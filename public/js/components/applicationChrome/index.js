import createApplicationChrome from "./applicationChrome.js";

/**
 * @param {Document | Element} [root]
 * @returns {void}
 */
export function initialize(root = document) {
	root.querySelectorAll("[data-application-chrome]").forEach((element) => {
		if (!(element instanceof HTMLElement)) return;

		createApplicationChrome(element);
	});
}
