/**
 * Resolve a count-aware translation while keeping isolated view-model tests
 * useful when no i18next translator is supplied.
 *
 * @param {unknown} translate
 * @param {string} key
 * @param {number} count
 * @param {{one: string, other: string} & Record<string, unknown>} options
 */
export default function translateCount(translate, key, count, options) {
	const t =
		typeof translate === "function"
			? translate
			: (_key, values = {}) =>
					String(values.defaultValue ?? "").replace(
						/\{\{(\w+)\}\}/g,
						(_match, name) => values[name] ?? _match,
					);
	const { one, other, ...values } = options;
	return t(key, {
		...values,
		count,
		defaultValue: count === 1 ? one : other,
	});
}
