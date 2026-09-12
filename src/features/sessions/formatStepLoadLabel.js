import {
	formatLocaleNumber,
	formatMeasurementSymbol,
} from "../../infrastructure/i18n/formatLocale.js";

/**
 * @param {{loadValue?: number | null, loadUnit?: string | null, equipmentName?: string | null, language?: string}} step
 * @returns {string}
 */
export default function formatStepLoadLabel({
	loadValue = null,
	loadUnit = null,
	equipmentName = null,
	language = "en",
}) {
	if (loadValue !== null && loadValue !== undefined) {
		return [
			formatLocaleNumber(loadValue, language, { maximumFractionDigits: 2 }),
			loadUnit ? formatMeasurementSymbol(loadUnit) : null,
		]
			.filter(Boolean)
			.join(" ");
	}

	if (equipmentName) {
		return `Choose a manageable ${equipmentName.toLowerCase()} load`;
	}

	return "No external load";
}
