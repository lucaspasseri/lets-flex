function createAccordion(root) {
	const trigger = root.querySelector("[data-accordion-header]");
	const panel = root.querySelector("[data-accordion-panel]");

	trigger.addEventListener("click", () => collapsedClassToggle(root, panel));
	trigger.addEventListener("keydown", e => handleKeyDown(e, root, panel));

	if (panel.hidden) {
		trigger.classList.add("collapsed");
		trigger.setAttribute("aria-expanded", false);
	} else {
		trigger.setAttribute("aria-expanded", true);
	}
}

function collapsedClassToggle(accordion, panel) {
	if (!panel.hidden) {
		accordion.classList.toggle("collapsed");

		setTimeout(() => {
			panel.hidden = !panel.hidden;
			accordion
				.querySelector("[data-accordion-header]")
				.setAttribute("aria-expanded", !panel.hidden);
		}, 200);
	} else {
		panel.hidden = !panel.hidden;
		accordion
			.querySelector("[data-accordion-header]")
			.setAttribute("aria-expanded", !panel.hidden);

		setTimeout(() => {
			accordion.classList.toggle("collapsed");
		}, 20);
	}
}

function handleKeyDown(e, root, panel) {
	const key = e.code;

	if (key === "Space" || key === "Enter") {
		collapsedClassToggle(root, panel);
	}
}

export default createAccordion;
