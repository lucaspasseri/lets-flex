export function initializeArchiveSessionForm(root, form) {
	root.addEventListener("click", (event) => {
		const button = event.target.closest("[data-archive-session-template]");
		if (!button) return;
		let values;
		try {
			values = JSON.parse(button.dataset.archiveSessionTemplate);
		} catch {
			return;
		}
		form.action = `/sessions/${values.sessionId}/archive?_method=PATCH`;
	});
}
