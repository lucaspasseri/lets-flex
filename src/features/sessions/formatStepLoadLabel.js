/**
 * @param {{loadValue?: number | null, loadUnit?: string | null, equipmentName?: string | null}} step
 * @returns {string}
 */
export default function formatStepLoadLabel({
	loadValue = null,
	loadUnit = null,
	equipmentName = null,
}) {
	if (loadValue !== null && loadValue !== undefined) {
		return [loadValue, loadUnit].filter(Boolean).join(" ");
	}

	if (equipmentName) {
		return `Choose a manageable ${equipmentName.toLowerCase()} load`;
	}

	return "No external load";
}
