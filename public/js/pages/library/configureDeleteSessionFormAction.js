export function initializeDeleteSessionForm(root, form) {
	root.addEventListener("click", (event) => {
		const button = event.target.closest("[data-delete-session-template]");
		if (!button) return;
		let values;
		try {
			values = JSON.parse(button.dataset.deleteSessionTemplate);
		} catch {
			return;
		}
		form.action = `/sessions/${values.sessionId}?_method=DELETE`;
	});
}
