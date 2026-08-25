export function initializeUpdateExerciseForm(root, form) {
	root.addEventListener("click", (event) => {
		const button = event.target.closest("[data-update-exercise-template]");
		if (!button) return;

		let values;
		try {
			values = JSON.parse(button.dataset.updateExerciseTemplate);
		} catch {
			return;
		}

		form.action = `/exerciseTemplates/${values.exerciseId}/variants/${values.variantId}?_method=PATCH`;
		setValue(form, "name", values.name);
		setValue(form, "movementPatternId", values.movementPatternId);
		setValue(form, "equipmentId", values.equipmentId);
		/** @type {any} */ (form).populateMuscleRelations?.(
			Array.isArray(values.muscleGroup) ? values.muscleGroup : [],
		);
	});
}

function setValue(form, name, value) {
	const control = form.elements.namedItem(name);
	if (control) control.value = value == null ? "" : String(value);
}
