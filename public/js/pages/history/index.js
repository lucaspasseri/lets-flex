const HISTORY_SCROLL_STORAGE_PREFIX = "lets-flex:history-scroll:";

function isPrimaryActivation(event) {
	return (
		(event.button === undefined || event.button === 0) &&
		!event.metaKey &&
		!event.ctrlKey &&
		!event.shiftKey &&
		!event.altKey
	);
}

function readSnapshot(storage, key) {
	try {
		const value = storage.getItem(key);
		if (!value) return null;
		const snapshot = JSON.parse(value);
		if (
			!Number.isFinite(snapshot?.top) ||
			snapshot.top < 0 ||
			!Number.isFinite(snapshot?.left) ||
			snapshot.left < 0
		) {
			return null;
		}
		return { top: snapshot.top, left: snapshot.left };
	} catch {
		return null;
	}
}

function isReturnNavigation(windowRef, event) {
	if (windowRef.location.hash === "#history-results-heading" || event?.persisted) {
		return true;
	}

	const navigationEntry = windowRef.performance?.getEntriesByType?.("navigation")?.[0];
	return navigationEntry?.type === "back_forward";
}

/**
 * Preserve the app-content position only while opening a history detail page.
 * @param {Document} root
 * @param {Window} windowRef
 */
export function initializeHistoryScrollRestoration(
	root = document,
	windowRef = window,
) {
	const content = root.querySelector("[data-page-content]");
	const page = root.querySelector("[data-workout-history-page]");
	if (!(content instanceof HTMLElement) || !(page instanceof HTMLElement)) return;
	const scrollContainer = /** @type {HTMLElement} */ (content);

	const key = `${HISTORY_SCROLL_STORAGE_PREFIX}${windowRef.location.pathname}${windowRef.location.search}`;

	page.querySelectorAll("[data-history-detail-link]").forEach((link) => {
		link.addEventListener("click", (event) => {
			if (event.defaultPrevented || !isPrimaryActivation(event)) return;

			try {
				windowRef.sessionStorage.setItem(
					key,
					JSON.stringify({
						top: scrollContainer.scrollTop,
						left: scrollContainer.scrollLeft,
					}),
				);
			} catch {
				// Scroll restoration is an enhancement; navigation remains unaffected.
			}
		});
	});

	/** @param {PageTransitionEvent} [event] */
	function restore(event) {
		let snapshot;
		try {
			snapshot = readSnapshot(windowRef.sessionStorage, key);
			windowRef.sessionStorage.removeItem(key);
		} catch {
			return;
		}
		if (!snapshot || !isReturnNavigation(windowRef, event)) return;

		const apply = () => {
			scrollContainer.scrollTop = snapshot.top;
			scrollContainer.scrollLeft = snapshot.left;
		};
		if (typeof windowRef.requestAnimationFrame === "function") {
			windowRef.requestAnimationFrame(apply);
		} else {
			apply();
		}
	}

	windowRef.addEventListener("pageshow", (event) => restore(event));
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
	initializeHistoryScrollRestoration();
}
