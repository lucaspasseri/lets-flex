const TRANSITION_FALLBACK_MS = 300;

/**
 * @param {Element} root
 * @param {{schedule?: typeof setTimeout, cancel?: typeof clearTimeout}} [timing]
 */
function createAccordion(root, { schedule = setTimeout, cancel = clearTimeout } = {}) {
	const trigger = /** @type {HTMLElement} */ (
		root.querySelector("[data-accordion-header]")
	);
	const panel = /** @type {HTMLElement} */ (
		root.querySelector("[data-accordion-panel]")
	);

	let animating = false;
	let opening = false;
	/** @type {ReturnType<typeof setTimeout> | null} */
	let transitionFallback = null;

	trigger.addEventListener("click", toggle);
	panel.addEventListener("transitionend", handleTransitionEnd);

	if (panel.hidden) {
		trigger.setAttribute("aria-expanded", "false");
	} else {
		trigger.setAttribute("aria-expanded", "true");
	}

	function open() {
		animating = true;
		opening = true;
		panel.hidden = false;
		root.classList.remove("collapsed");
		trigger.setAttribute("aria-expanded", "true");
		scheduleTransitionFallback();
	}

	function close() {
		animating = true;
		opening = false;
		root.classList.add("collapsed");
		trigger.setAttribute("aria-expanded", "false");
		scheduleTransitionFallback();
	}

	function toggle() {
		if (!animating) {
			panel.hidden ? open() : close();
		}
	}

	/** @param {TransitionEvent} e */
	function handleTransitionEnd(e) {
		if (e.target !== panel || e.propertyName !== "grid-template-rows") return;
		finishTransition();
	}

	function scheduleTransitionFallback() {
		if (transitionFallback !== null) cancel(transitionFallback);
		transitionFallback = schedule(finishTransition, TRANSITION_FALLBACK_MS);
	}

	function finishTransition() {
		if (!opening) {
			panel.hidden = true;
		}

		animating = false;
		if (transitionFallback !== null) {
			cancel(transitionFallback);
			transitionFallback = null;
		}
	}
}

export default createAccordion;
