document.addEventListener("click", event => {
	const button = event.target.closest(
		"[data-modal-open='deleteExerciseModal']",
	);
	if (!button) return;

	const modalId = button.dataset.modalOpen;
	const modal = document.getElementById(modalId);

	const exerciseId = button.dataset.exerciseId;

	const form = modal?.querySelector("form") ?? {};
	form.action = `/exerciseTemplates/${exerciseId}?_method=DELETE`;
});
