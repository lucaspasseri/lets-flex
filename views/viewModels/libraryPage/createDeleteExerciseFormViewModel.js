export default function createDeleteExerciseFormViewModel() {
	return {
		modal: {
			id: "deleteExerciseModal",
			title: "Delete exercise template",
		},
		form: {
			id: "delete-exercise-template-form",
			heading: "Delete exercise template",
			description: "Are you sure you want to continue?",
			action: "/exerciseTemplates",
		},
		actions: {
			cancel: { label: "Cancel" },
			submit: { label: "Delete exercise" },
		},
	};
}
