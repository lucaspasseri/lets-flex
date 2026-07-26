import toCapitalizedString from "../../../utils/toCapitalizedString.js";

export function toEquipment(equipment) {
	return {
		id: equipment.id,
		name: equipment.name,
		category: toCapitalizedString(equipment.category)?.replaceAll("_", " "),
	};
}
