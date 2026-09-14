import createViewModelTranslator from "../translate.js";

export default function createDeleteSessionFormViewModel(translate) {
	const t = createViewModelTranslator(translate);
	return {
		modal: {
			id: "deleteSessionModal",
			title: t("library.deleteSessionTitle", { defaultValue: "Delete session" }),
		},
		form: {
			id: "delete-session-form",
			heading: t("library.deleteSessionTitle", { defaultValue: "Delete session" }),
			description: t("library.deleteSessionDescription", {
				defaultValue:
					"Delete this reusable session? Sessions used by a workout plan are archived so their history remains available.",
			}),
			action: "/sessions",
		},
		actions: {
			cancel: { label: t("actions.cancel", { defaultValue: "Cancel" }) },
			submit: {
				label: t("library.deleteSessionTitle", { defaultValue: "Delete session" }),
			},
		},
	};
}
