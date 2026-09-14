import createViewModelTranslator from "../translate.js";

export default function createDeleteExerciseFormViewModel(translate) {
	const t = createViewModelTranslator(translate);
	return {
		modal: {
			id: "deleteExerciseModal",
			title: t("library.archiveExerciseTitle", { defaultValue: "Archive exercise" }),
		},
		form: {
			id: "delete-exercise-template-form",
			heading: t("library.archiveExerciseTitle", { defaultValue: "Archive exercise" }),
			description: t("library.archiveExerciseDescription", {
				defaultValue:
					"Archive this exercise? Existing plans and history are preserved.",
			}),
			action: "/admin/library/exercises",
		},
		actions: {
			cancel: { label: t("actions.cancel", { defaultValue: "Cancel" }) },
			submit: {
				label: t("library.archiveExerciseTitle", { defaultValue: "Archive exercise" }),
			},
		},
	};
}
