/**
 * Keep view models usable in isolated unit tests while using the established EJS/i18next
 * translator when a controller supplies one.
 * @param {unknown} translate
 */
export default function createViewModelTranslator(translate) {
	return typeof translate === "function"
		? translate
		: (_key, options = {}) =>
				String(options.defaultValue ?? "").replace(
					/\{\{(\w+)\}\}/g,
					(_match, name) => options[name] ?? _match,
				);
}
