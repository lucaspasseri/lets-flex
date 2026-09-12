const DESKTOP_MEDIA_QUERY = "(min-width: 48rem)";
const FOCUSABLE_SELECTOR = [
	"a[href]",
	"button:not([disabled])",
	'[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * @param {HTMLElement} root
 * @param {{mediaQuery?: MediaQueryList}} [options]
 */
export default function createApplicationChrome(root, options = {}) {
	const documentRef = root.ownerDocument;
	const body = documentRef.body;
	const toggleCandidate = /** @type {HTMLButtonElement | null} */ (
		root.querySelector("[data-application-menu-toggle]")
	);
	const menuCandidate = /** @type {HTMLElement | null} */ (
		root.querySelector("[data-application-menu]")
	);
	const content = /** @type {HTMLElement | null} */ (
		documentRef.querySelector("[data-page-content]")
	);
	const mediaQuery = options.mediaQuery ?? window.matchMedia(DESKTOP_MEDIA_QUERY);

	if (
		!(toggleCandidate instanceof HTMLButtonElement) ||
		!(menuCandidate instanceof HTMLElement)
	) {
		throw new Error("Invalid application chrome structure");
	}
	const toggle = toggleCandidate;
	const menu = menuCandidate;

	let isOpen = false;
	let ownsContentInertness = false;
	/** @type {HTMLElement | null} */
	let previouslyFocusedElement = null;

	toggle.addEventListener("click", handleToggle);
	root.addEventListener("keydown", handleKeyDown);
	menu.querySelectorAll("[data-application-navigation-link]").forEach((link) => {
		link.addEventListener("click", handleDestinationActivation);
	});
	mediaQuery.addEventListener("change", handleBreakpointChange);
	documentRef.defaultView?.addEventListener("resize", handleViewportResize);

	synchronizeBreakpoint();

	function handleToggle() {
		if (isOpen) close();
		else open();
	}

	function open() {
		if (isOpen || mediaQuery.matches) return;

		isOpen = true;
		previouslyFocusedElement = toggle;

		root.classList.add("is-menu-open");
		menu.classList.add("is-open");
		menu.removeAttribute("inert");
		menu.setAttribute("aria-hidden", "false");
		setToggleState(true);
		disableBackground();
		getMenuFocusableElements()[0]?.focus({ preventScroll: true });
	}

	/** @param {{restoreFocus?: boolean}} [options] */
	function close({ restoreFocus = true } = {}) {
		if (!isOpen) return;

		isOpen = false;
		root.classList.remove("is-menu-open");
		menu.classList.remove("is-open");
		menu.setAttribute("inert", "");
		menu.setAttribute("aria-hidden", "true");
		setToggleState(false);
		enableBackground();

		if (restoreFocus) restorePreviousFocus();
		else previouslyFocusedElement = null;
	}

	function handleDestinationActivation() {
		close({ restoreFocus: false });
	}

	/** @param {KeyboardEvent} event */
	function handleKeyDown(event) {
		if (!isOpen) return;

		if (event.key === "Escape") {
			event.preventDefault();
			close();
			return;
		}

		if (event.key !== "Tab") return;

		const focusableElements = getOpenChromeFocusableElements();
		if (focusableElements.length === 0) return;

		const firstElement = focusableElements[0];
		const lastElement = focusableElements.at(-1);
		const activeElement = documentRef.activeElement;

		if (!focusableElements.includes(/** @type {HTMLElement} */ (activeElement))) {
			event.preventDefault();
			firstElement?.focus({ preventScroll: true });
			return;
		}

		if (event.shiftKey && activeElement === firstElement) {
			event.preventDefault();
			lastElement?.focus({ preventScroll: true });
			return;
		}

		if (!event.shiftKey && activeElement === lastElement) {
			event.preventDefault();
			firstElement?.focus({ preventScroll: true });
		}
	}

	function handleBreakpointChange() {
		synchronizeBreakpoint();
	}

	function handleViewportResize() {
		synchronizeBreakpoint();
	}

	function synchronizeBreakpoint() {
		if (mediaQuery.matches) {
			isOpen = false;
			root.classList.remove("is-menu-open");
			menu.classList.remove("is-open");
			menu.removeAttribute("inert");
			menu.removeAttribute("aria-hidden");
			setToggleState(false);
			enableBackground();
			previouslyFocusedElement = null;
			return;
		}

		if (!isOpen) {
			menu.setAttribute("inert", "");
			menu.setAttribute("aria-hidden", "true");
			setToggleState(false);
		}
	}

	/** @param {boolean} expanded */
	function setToggleState(expanded) {
		toggle.setAttribute("aria-expanded", String(expanded));
		toggle.setAttribute(
			"aria-label",
			expanded
				? (toggle.getAttribute("data-close-label") ?? "Close navigation menu")
				: (toggle.getAttribute("data-open-label") ?? "Open navigation menu"),
		);
	}

	function disableBackground() {
		body.classList.add("has-open-navigation");

		if (content && !content.hasAttribute("inert")) {
			content.setAttribute("inert", "");
			ownsContentInertness = true;
		}
	}

	function enableBackground() {
		body.classList.remove("has-open-navigation");

		if (ownsContentInertness && content && !body.classList.contains("has-open-modal")) {
			content.removeAttribute("inert");
		}

		ownsContentInertness = false;
	}

	function restorePreviousFocus() {
		const focusTarget =
			previouslyFocusedElement?.isConnected &&
			!previouslyFocusedElement.closest("[hidden], [inert]")
				? previouslyFocusedElement
				: toggle;

		focusTarget.focus({ preventScroll: true });
		previouslyFocusedElement = null;
	}

	function getMenuFocusableElements() {
		return Array.from(
			/** @type {NodeListOf<HTMLElement>} */ (
				menu.querySelectorAll(FOCUSABLE_SELECTOR)
			),
		).filter(isFocusable);
	}

	function getOpenChromeFocusableElements() {
		return [toggle, ...getMenuFocusableElements()].filter(isFocusable);
	}

	/** @param {HTMLElement} element */
	function isFocusable(element) {
		return (
			!element.closest("[hidden], [inert]") &&
			element.getAttribute("aria-hidden") !== "true" &&
			element.getClientRects().length > 0
		);
	}

	return {
		open,
		close,
		get isOpen() {
			return isOpen;
		},
	};
}
