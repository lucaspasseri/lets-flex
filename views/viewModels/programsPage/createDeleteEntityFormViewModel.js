export default function createDeleteEntityFormViewModel(entity) {
	const capitalized = `${entity[0].toUpperCase()}${entity.slice(1)}`;
	return {
		modal: { id: `delete${capitalized}Modal`, title: `Delete ${entity}` },
		form: {
			id: `delete-${entity}-form`,
			heading: `Delete ${entity}`,
			description: `Are you sure you want to delete this ${entity}?`,
			action: `/${entity}s`,
		},
		actions: {
			cancel: { label: "Cancel" },
			submit: { label: `Delete ${entity}` },
		},
	};
}
