/**
 * @param {*} value
 * @returns { number | null}
 */

function toNullableNumber(value) {
	if (value == null || value === "") return null;

	const parsed = Number(value);

	return Number.isNaN(parsed) ? null : parsed;
}

export default toNullableNumber;
