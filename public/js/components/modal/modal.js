function createModal(root) {
	const pageContent = document.querySelector("[data-page-content]");
	const backdrop = root.querySelector("[data-modal-backdrop]");
	const content = root.querySelector("[data-modal-content]");
	const closeButton = root.querySelector("[data-modal-close-button]");
	const openTrigger =
		root.id && document.querySelector(`[data-modal-open="${root.id}"]`);
	const closeTrigger =
		root.id && document.querySelector(`[data-modal-close="${root.id}"]`);

	if (!backdrop || !content || !closeButton) {
		throw new Error("Invalid modal structure");
	}

	if (pageContent?.contains(root)) {
		throw new Error(
			"The modal must be outside [data-page-content], otherwise it will become inert.",
		);
	}

	let state = root.hidden ? "closed" : "open";
	let previouslyFocusedElement = null;
	let scrollPosition = 0;

	openTrigger?.addEventListener("click", open);
	closeTrigger?.addEventListener("click", close);
	backdrop.addEventListener("click", close);
	closeButton.addEventListener("click", close);
	root.addEventListener("keydown", handleKeyDown);

	function open() {
		if (state !== "closed") return;

		state = "opening";
		previouslyFocusedElement = document.activeElement;

		disableBackground();
		root.hidden = false;

		requestAnimationFrame(() => {
			waitForTransition({
				element: content,
				property: "transform",

				start() {
					content.classList.add("is-open");
					backdrop.classList.add("is-open");
				},

				complete() {
					state = "open";
					moveFocusIntoModal();
				},
			});
		});
	}

	function close() {
		if (state !== "open") return;

		state = "closing";

		waitForTransition({
			element: content,
			property: "transform",

			start() {
				content.classList.remove("is-open");
				backdrop.classList.remove("is-open");
			},

			complete() {
				finishClosing();
			},
		});
	}

	function finishClosing() {
		root.hidden = true;
		state = "closed";

		enableBackground();
		restoreFocus();
	}

	function moveFocusIntoModal() {
		const focusableElements = getFocusableElements();
		const focusTarget = focusableElements[0] ?? content;

		focusTarget.focus({ preventScroll: true });
	}

	function restoreFocus() {
		const focusTarget = isValidFocusTarget(previouslyFocusedElement)
			? previouslyFocusedElement
			: openTrigger;

		focusTarget?.focus({ preventScroll: true });
		previouslyFocusedElement = null;
	}

	function isValidFocusTarget(element) {
		return (
			element instanceof HTMLElement &&
			element.isConnected &&
			!element.closest("[hidden], [inert]")
		);
	}

	function waitForTransition({ element, property, start, complete }) {
		let hasCompleted = false;
		let fallbackTimer = null;

		function finish() {
			if (hasCompleted) return;

			hasCompleted = true;
			clearTimeout(fallbackTimer);

			element.removeEventListener("transitionend", handleTransitionEnd);
			element.removeEventListener("transitioncancel", handleTransitionCancel);

			complete();
		}

		function handleTransitionEnd(event) {
			if (event.target !== element) return;
			if (event.propertyName !== property) return;

			finish();
		}

		function handleTransitionCancel(event) {
			if (event.target !== element) return;
			if (event.propertyName !== property) return;

			finish();
		}

		element.addEventListener("transitionend", handleTransitionEnd);
		element.addEventListener("transitioncancel", handleTransitionCancel);

		start();

		const transitionTime = getMaximumTransitionTime(element);

		if (transitionTime === 0) {
			/*
			 * Complete asynchronously so that start() finishes before
			 * the modal changes state.
			 */
			queueMicrotask(finish);
			return;
		}

		/*
		 * transitionend normally calls finish(). This timer is only a
		 * fallback if the browser does not dispatch the event.
		 */
		fallbackTimer = setTimeout(finish, transitionTime + 50);
	}

	function getMaximumTransitionTime(element) {
		const styles = getComputedStyle(element);

		const durations = parseTimeList(styles.transitionDuration);
		const delays = parseTimeList(styles.transitionDelay);
		const itemCount = Math.max(durations.length, delays.length);

		let maximumTime = 0;

		for (let index = 0; index < itemCount; index += 1) {
			const duration = durations[index % durations.length] ?? 0;
			const delay = delays[index % delays.length] ?? 0;

			maximumTime = Math.max(maximumTime, duration + delay);
		}

		return maximumTime;
	}

	function parseTimeList(value) {
		return value.split(",").map(time => {
			const normalizedTime = time.trim();
			const numericValue = Number.parseFloat(normalizedTime);

			if (Number.isNaN(numericValue)) return 0;

			return normalizedTime.endsWith("ms") ? numericValue : numericValue * 1000;
		});
	}

	function getFocusableElements() {
		const focusableSelectors = [
			"a[href]",
			'input:not([disabled]):not([type="hidden"])',
			"select:not([disabled])",
			"textarea:not([disabled])",
			"button:not([disabled])",
			'[tabindex]:not([tabindex="-1"])',
		];

		return Array.from(
			root.querySelectorAll(focusableSelectors.join(",")),
		).filter(element => {
			return (
				!element.closest("[hidden], [inert]") &&
				element.getAttribute("aria-hidden") !== "true" &&
				element.getClientRects().length > 0
			);
		});
	}

	function handleKeyDown(event) {
		if (event.key === "Escape") {
			event.preventDefault();
			close();
			return;
		}

		if (event.key !== "Tab") return;

		const focusableElements = getFocusableElements();

		if (focusableElements.length === 0) {
			event.preventDefault();
			content.focus({ preventScroll: true });
			return;
		}

		const firstElement = focusableElements[0];
		const lastElement = focusableElements.at(-1);
		const activeElement = document.activeElement;
		const focusIsInsideList = focusableElements.includes(activeElement);

		if (!focusIsInsideList) {
			event.preventDefault();

			const focusTarget = event.shiftKey ? lastElement : firstElement;

			focusTarget.focus();
			return;
		}

		if (event.shiftKey && activeElement === firstElement) {
			event.preventDefault();
			lastElement.focus();
			return;
		}

		if (!event.shiftKey && activeElement === lastElement) {
			event.preventDefault();
			firstElement.focus();
		}
	}

	function disableBackground() {
		pageContent?.setAttribute("inert", "");

		scrollPosition = window.scrollY;

		document.body.style.top = `-${scrollPosition}px`;
		document.body.classList.add("has-open-modal");
	}

	function enableBackground() {
		pageContent?.removeAttribute("inert");

		document.body.classList.remove("has-open-modal");
		document.body.style.top = "";

		window.scrollTo(0, scrollPosition);
	}

	return {
		open,
		close,
	};
}

export default createModal;
