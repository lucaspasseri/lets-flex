export default function createArchiveSessionFormViewModel() {
	return {
		modal: {
			id: "archiveSessionModal",
			title: "Archive session template",
		},
		form: {
			id: "archive-session-template-form",
			heading: "Archive session template",
			description: "Archive this session template? It will remain in existing workout history.",
			action: "/sessions",
		},
		actions: {
			cancel: { label: "Cancel" },
			submit: { label: "Archive session" },
		},
	};
}
