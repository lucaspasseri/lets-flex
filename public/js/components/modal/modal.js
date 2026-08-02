function createModal(root) {
	const backdrop = root.querySelector("[data-modal-backdrop]");
	const content = root.querySelector("[data-modal-content]");
	const closeButton = root.querySelector("[data-modal-close-button]");
	const trigger =
		root.id && document.querySelector(`[data-modal-open="${root.id}"]`);

	let isClosing = false;
	let isTransitioning = false;

	trigger.addEventListener("click", open);
	backdrop.addEventListener("click", close);
	closeButton.addEventListener("click", close);
	content.addEventListener("transitionend", handleTransitionEnd);

	function open() {
		if (isTransitioning || !root.hidden) return;

		root.hidden = false;

		isClosing = false;
		isTransitioning = true;

		requestAnimationFrame(() => {
			content.classList.add("is-open");
			backdrop.classList.add("is-open");
			content.focus({ preventScroll: true });
		});
	}

	function close() {
		if (isTransitioning || root.hidden) return;

		isClosing = true;
		isTransitioning = true;
		content.classList.remove("is-open");
		backdrop.classList.remove("is-open");
	}

	function handleTransitionEnd(event) {
		if (event.target !== content) return;
		if (event.propertyName !== "transform") return;

		if (isClosing) {
			root.hidden = true;
			isClosing = false;
			trigger.focus({ preventScroll: true });
		}

		isTransitioning = false;
	}
}
export default createModal;
