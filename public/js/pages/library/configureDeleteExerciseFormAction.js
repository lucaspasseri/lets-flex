export function initializeDeleteExerciseForm(root, form) {
	root.addEventListener("click", event => {
		const button = event.target.closest("[data-exercise-id]");
		if (!button) return;
		form.action = `/exerciseTemplates/${button.dataset.exerciseId}?_method=DELETE`;
	});
}
