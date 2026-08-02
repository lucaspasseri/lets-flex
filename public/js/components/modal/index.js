import createModal from "./modal.js";

export function initialize(root = document) {
	root
		.querySelectorAll("[data-modal]")
		.forEach(element => createModal(element));
}
