import createModal from "./modal.js";

/**
 * Initializes every modal below a root and opens server-requested modals after
 * their event handlers and focus management are ready.
 *
 * @param {Document | Element} [root]
 * @returns {void}
 */
export function initialize(root = document) {
	root
		.querySelectorAll("[data-modal]")
		.forEach(element => {
			const modal = createModal(element);

			if (element.hasAttribute("data-modal-open-on-load")) {
				modal.open();
			}
		});
}
