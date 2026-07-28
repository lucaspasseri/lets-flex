function createAccordion(root) {
	const trigger = root.querySelector("[data-accordion-heading]");
	const panel = root.querySelector("[data-accordion-panel]");

	trigger.addEventListener("click", () => {
		collapsedClassToggle(root, panel);
	});
}

function collapsedClassToggle(accordion, panel) {
	if (!panel.hidden) {
		accordion.classList.toggle("collapsed");

		setTimeout(() => {
			panel.hidden = !panel.hidden;
		}, 220);
	} else {
		panel.hidden = !panel.hidden;

		setTimeout(() => {
			accordion.classList.toggle("collapsed");
		}, 30);
	}
}

export default createAccordion;
