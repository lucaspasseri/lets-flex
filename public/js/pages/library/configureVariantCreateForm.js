export function initializeVariantCreateForm(form) {
	form.addEventListener("submit", () => {
		const exerciseControl = form.elements.namedItem("exerciseId");
		const exerciseId = exerciseControl?.value;
		const actionPrefix = form.dataset.actionPrefix;
		if (!exerciseId || !actionPrefix) return;
		form.action = `${actionPrefix}/${exerciseId}/variants`;
	});
}
