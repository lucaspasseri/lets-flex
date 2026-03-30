function toNullableNumber(value) {
	if (value === undefined || value === null || value === "") return null;
	return Number(value);
}

export default toNullableNumber;
