/**
 * @param {Array<string | null | undefined>} values
 * @returns {Array<{value: string, label: string}>}
 */
export default function createDiscoveryFilterOptions(values) {
	const labelsByValue = new Map();

	for (const value of values) {
		const label = value?.trim();
		if (!label) continue;

		const normalizedValue = label.toLocaleLowerCase();
		if (!labelsByValue.has(normalizedValue)) {
			labelsByValue.set(normalizedValue, label);
		}
	}

	return [...labelsByValue.entries()]
		.map(([value, label]) => ({ value, label }))
		.sort((first, second) => first.label.localeCompare(second.label));
}
