export const THEME_STORAGE_KEY = "lets-flex-theme";
export const SUPPORTED_THEMES = Object.freeze(["classic", "neon"]);

/** @param {unknown} value @returns {value is "classic" | "neon"} */
export function isSupportedTheme(value) {
	return SUPPORTED_THEMES.includes(/** @type {"classic" | "neon"} */ (value));
}

/** @param {unknown} value @returns {"classic" | "neon"} */
export function normalizeTheme(value) {
	return isSupportedTheme(value) ? value : "classic";
}

/** @returns {Storage | null} */
function getThemeStorage() {
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

/** @param {Storage | null} [storage] @returns {"classic" | "neon"} */
export function readStoredTheme(storage = getThemeStorage()) {
	if (!storage) return "classic";

	try {
		return normalizeTheme(storage.getItem(THEME_STORAGE_KEY));
	} catch {
		return "classic";
	}
}

/** @param {unknown} theme @param {Document} [documentRef] */
export function applyTheme(theme, documentRef = document) {
	const normalizedTheme = normalizeTheme(theme);
	documentRef.documentElement.dataset.theme = normalizedTheme;
	return normalizedTheme;
}

/** @param {unknown} theme @param {Storage | null} [storage] */
export function persistTheme(theme, storage = getThemeStorage()) {
	const normalizedTheme = normalizeTheme(theme);
	if (!storage) return normalizedTheme;

	try {
		storage.setItem(THEME_STORAGE_KEY, normalizedTheme);
	} catch {
		// Theme switching still applies for this visit when persistence is unavailable.
	}

	return normalizedTheme;
}

/**
 * @param {Document | Element} [root]
 * @param {{documentRef?: Document, storage?: Storage | null}} [dependencies]
 */
export function initializeThemeSelector(root = document, dependencies = {}) {
	const documentRef =
		dependencies.documentRef ?? root.ownerDocument ?? /** @type {Document} */ (root);
	const storage =
		dependencies.storage === undefined ? getThemeStorage() : dependencies.storage;
	const selector = root.querySelector("[data-theme-selector]");
	if (!selector) return;

	const options = /** @type {HTMLInputElement[]} */ (
		Array.from(selector.querySelectorAll("[data-theme-option]"))
	);
	const initialTheme = applyTheme(
		documentRef.documentElement.dataset.theme ?? readStoredTheme(storage),
		documentRef,
	);
	synchronizeOptions(selector, options, initialTheme);

	options.forEach((option) => {
		option.addEventListener("change", (event) => {
			const selectedOption = /** @type {HTMLInputElement} */ (event.currentTarget);
			const selectedTheme = selectedOption.dataset.themeOption;
			if (!selectedOption.checked || !isSupportedTheme(selectedTheme)) return;

			const activeTheme = applyTheme(selectedTheme, documentRef);
			persistTheme(activeTheme, storage);
			synchronizeOptions(selector, options, activeTheme);
		});
	});
}

/**
 * @param {Element} selector
 * @param {HTMLInputElement[]} options
 * @param {"classic" | "neon"} activeTheme
 */
function synchronizeOptions(selector, options, activeTheme) {
	selector.setAttribute("data-active-theme", activeTheme);
	options.forEach((option) => {
		option.checked = option.dataset.themeOption === activeTheme;
	});

	const currentThemeStatus = /** @type {HTMLElement | null} */ (
		selector.querySelector("[data-theme-current]")
	);
	const currentThemeName = selector.querySelector("[data-theme-current-name]");
	const activeOption = options.find(
		(option) => option.dataset.themeOption === activeTheme,
	);
	const translatedThemeName = activeOption
		?.closest("label")
		?.querySelector("strong")
		?.textContent?.trim();
	if (currentThemeName)
		currentThemeName.textContent = translatedThemeName || activeTheme;
	if (currentThemeStatus) currentThemeStatus.hidden = false;
}
