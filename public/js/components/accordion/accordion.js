function createAccordion(root) {
	const trigger = root.querySelector("[data-accordion-header]");
	const panel = root.querySelector("[data-accordion-panel]");

	let animating = false;
	let opening = false;

	trigger.addEventListener("click", toggle);
	panel.addEventListener("transitionend", handleTransitionEnd);

	if (panel.hidden) {
		trigger.setAttribute("aria-expanded", false);
	} else {
		trigger.setAttribute("aria-expanded", true);
	}

	function open() {
		animating = true;
		opening = true;
		panel.hidden = false;
		root.classList.remove("collapsed");
		trigger.setAttribute("aria-expanded", true);
	}

	function close() {
		animating = true;
		opening = false;
		root.classList.add("collapsed");
		trigger.setAttribute("aria-expanded", false);
	}

	function toggle() {
		if (!animating) {
			panel.hidden ? open() : close();
		}
	}

	function handleTransitionEnd(e) {
		if (e.propertyName !== "grid-template-rows") return;

		if (!opening) {
			panel.hidden = true;
		}

		animating = false;
	}
}

export default createAccordion;
