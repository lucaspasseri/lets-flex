import createViewModelTranslator from "../translate.js";

export default function createDeleteEntityFormViewModel(entity, translate) {
	const t = createViewModelTranslator(translate);
	const copy =
		entity === "program"
			? {
					title: "programs.deleteProgramFormTitle",
					description: "programs.deleteProgramFormDescription",
					action: "programs.deleteProgramFormAction",
				}
			: {
					title: "programs.deleteCycleFormTitle",
					description: "programs.deleteCycleFormDescription",
					action: "programs.deleteCycleFormAction",
				};
	const defaults = {
		title: `Delete ${entity}`,
		description: `Are you sure you want to delete this ${entity}?`,
		action: `Delete ${entity}`,
	};
	const capitalized = `${entity[0].toUpperCase()}${entity.slice(1)}`;
	return {
		modal: {
			id: `delete${capitalized}Modal`,
			title: t(copy.title, { defaultValue: defaults.title }),
		},
		form: {
			id: `delete-${entity}-form`,
			heading: t(copy.title, { defaultValue: defaults.title }),
			description: t(copy.description, { defaultValue: defaults.description }),
			action: `/${entity}s`,
		},
		actions: {
			cancel: { label: t("actions.cancel", { defaultValue: "Cancel" }) },
			submit: { label: t(copy.action, { defaultValue: defaults.action }) },
		},
	};
}
