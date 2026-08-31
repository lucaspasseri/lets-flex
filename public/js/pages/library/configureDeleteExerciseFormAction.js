export function initializeDeleteExerciseForm(root, form) {
	root.addEventListener("click", (event) => {
		const button = event.target.closest("[data-exercise-id]");
		if (!button) return;
		form.action = `/admin/library/exercises/${button.dataset.exerciseId}/archive`;
	});
}
