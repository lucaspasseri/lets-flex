export function initializeUpdateSessionForm(root, form) {
	root.addEventListener("click", (event) => {
		const button = event.target.closest("[data-update-session-template]");
		if (!button) return;
		let values;
		try {
			values = JSON.parse(button.dataset.updateSessionTemplate);
		} catch {
			return;
		}
		form.action = `/sessions/${values.sessionId}?_method=PATCH`;
		setValue(form, "name", values.name);
		setValue(form, "notes", values.notes);
		/** @type {any} */ (form).populateSessionSteps?.(
			Array.isArray(values.stepRow) ? values.stepRow : [],
		);
	});
}

function setValue(form, name, value) {
	const control = form.elements.namedItem(name);
	if (control) control.value = value == null ? "" : String(value);
}
