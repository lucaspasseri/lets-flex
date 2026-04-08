(() => {
	let activeModal = null;
	let lastFocusedElement = null;

	const FOCUSABLE_SELECTOR = [
		"a[href]",
		"button:not([disabled])",
		"input:not([disabled])",
		"select:not([disabled])",
		"textarea:not([disabled])",
		'[tabindex]:not([tabindex="-1"])',
	].join(",");

	function getFocusableElements(modal) {
		return Array.from(modal.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
			el => !el.hasAttribute("hidden"),
		);
	}

	function openModal(modal) {
		if (!modal) return;

		if (activeModal) {
			closeModal(activeModal, { restoreFocus: false });
		}

		lastFocusedElement = document.activeElement;
		activeModal = modal;

		modal.hidden = false;
		modal.setAttribute("aria-hidden", "false");
		document.body.classList.add("has-open-modal");

		const focusableElements = getFocusableElements(modal);
		const firstFocusable = focusableElements[0];
		firstFocusable?.focus();
	}

	function closeModal(modal = activeModal, options = {}) {
		if (!modal) return;

		const { restoreFocus = true } = options;

		modal.hidden = true;
		modal.setAttribute("aria-hidden", "true");
		document.body.classList.remove("has-open-modal");

		activeModal = null;

		if (restoreFocus && lastFocusedElement) {
			lastFocusedElement.focus();
			lastFocusedElement = null;
		}
	}

	function handleOpenClick(event) {
		const openButton = event.target.closest("[data-modal-open]");
		if (!openButton) return;

		const modalId = openButton.dataset.modalOpen;
		const modal = document.getElementById(modalId);

		if (!modal) return;

		openModal(modal);
	}

	function handleCloseClick(event) {
		const closeButton = event.target.closest("[data-modal-close]");
		if (!closeButton) return;

		const modal = closeButton.closest(".modal");
		closeModal(modal);
	}

	function trapFocus(event) {
		if (event.key !== "Tab" || !activeModal) return;

		const focusableElements = getFocusableElements(activeModal);

		if (focusableElements.length === 0) {
			event.preventDefault();
			return;
		}

		const first = focusableElements[0];
		const last = focusableElements[focusableElements.length - 1];

		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
			return;
		}

		if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	function handleKeydown(event) {
		if (!activeModal) return;

		if (event.key === "Escape") {
			closeModal(activeModal);
			return;
		}

		trapFocus(event);
	}

	document.addEventListener("click", event => {
		handleOpenClick(event);
		handleCloseClick(event);
	});

	document.addEventListener("keydown", handleKeydown);
})();
