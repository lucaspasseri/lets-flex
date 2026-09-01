export default function createDeleteExerciseFormViewModel() {
	return {
		modal: {
			id: "deleteExerciseModal",
			title: "Delete exercise template",
		},
		form: {
			id: "delete-exercise-template-form",
			heading: "Archive exercise",
			description: "Archive this exercise? Existing plans and history are preserved.",
			action: "/admin/library/exercises",
		},
		actions: {
			cancel: { label: "Cancel" },
			submit: { label: "Archive exercise" },
		},
	};
}
