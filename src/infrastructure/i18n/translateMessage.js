/**
 * Translate an application-owned message while keeping isolated callers safe when no
 * i18next function is available.
 *
 * @param {unknown} translate
 * @param {string} key
 * @param {string} defaultValue
 * @param {Record<string, unknown>} [values]
 */
export default function translateMessage(translate, key, defaultValue, values = {}) {
	const t =
		typeof translate === "function"
			? translate
			: (_key, options = {}) =>
					String(options.defaultValue ?? "").replace(
						/\{\{(\w+)\}\}/g,
						(_match, name) => options[name] ?? _match,
					);
	return t(key, { ...values, defaultValue });
}
