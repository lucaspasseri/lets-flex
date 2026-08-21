import toCapitalizedString from "../../../utils/toCapitalizedString.js";

/**
 * @typedef {import("./equipments.types.js").EquipmentRow} EquipmentRow
 * @typedef {import("./equipments.types.js").EquipmentMapper} EquipmentViewModel
 */

/**
 * @param {EquipmentRow} equipment
 * @returns {EquipmentViewModel}
 */

export function toEquipment(equipment) {
	return {
		id: equipment.id,
		name: equipment.name,
		category: toCapitalizedString(equipment.category)?.replaceAll("_", " "),
	};
}
