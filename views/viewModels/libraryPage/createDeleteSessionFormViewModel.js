export default function createDeleteSessionFormViewModel() {
	return {
		modal: {
			id: "deleteSessionModal",
			title: "Delete session",
		},
		form: {
			id: "delete-session-form",
			heading: "Delete session",
			description:
				"Delete this reusable session? Sessions used by a workout plan are archived so their history remains available.",
			action: "/sessions",
		},
		actions: {
			cancel: { label: "Cancel" },
			submit: { label: "Delete session" },
		},
	};
}
