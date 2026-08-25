import createAccordion from "./accordion.js";

export function initialize(root = document) {
	root
		.querySelectorAll("[data-accordion]")
		.forEach((element) => createAccordion(element));
}
