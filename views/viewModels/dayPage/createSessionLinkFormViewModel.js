import createViewModelTranslator from "../translate.js";

/**
 * @typedef {import("../../../src/features/sessions/sessions.types.js").SessionMapper} Session
 * @param {{currentDayId: number | null, sessions: Session[], state?: Record<string, any>, selectedSessionId?: number | null, translate?: Function}} input
 */
export default function createSessionLinkFormViewModel({
	currentDayId,
	sessions,
	state = {},
	selectedSessionId = null,
	translate,
}) {
	const t = createViewModelTranslator(translate);
	const values = state?.values && typeof state.values === "object" ? state.values : {};
	const errors = state?.errors ?? { fieldErrors: {}, formErrors: [] };
	const options = sessions
		.filter((session) => !session.isArchived)
		.map((session) => ({ label: session.name, value: session.id }));
	const disabled = currentDayId === null || options.length === 0;
	const submittedSessionId =
		typeof values.sessionId === "string" || typeof values.sessionId === "number"
			? String(values.sessionId)
			: "";
	const contextualSessionId = options.some(
		(option) => option.value === selectedSessionId,
	)
		? String(selectedSessionId)
		: "";
	const value = submittedSessionId || contextualSessionId;

	return {
		isEnabled: !disabled,
		hasTemplates: options.length > 0,
		action: "/workout_sessions",
		createAction: {
			label: options.length
				? t("library.createAnotherTemplate", {
						defaultValue: "Create another template",
					})
				: t("library.createSessionTemplate", {
						defaultValue: "Create a session template",
					}),
			href: currentDayId ? `/library?createSessionForDay=${currentDayId}` : "/library",
			isContextual: currentDayId !== null,
		},
		feedback:
			contextualSessionId && value === contextualSessionId
				? {
						title: t("library.sessionTemplateCreated", {
							defaultValue: "Session template created",
						}),
						message: t("library.sessionTemplateCreatedMessage", {
							defaultValue:
								"Your new template is selected. Review it, then assign it to this training day.",
						}),
					}
				: null,
		method: "POST",
		fields: {
			trainingDayId: currentDayId,
			session: {
				id: "sessionSelect",
				label: t("library.sessionTemplate", { defaultValue: "Session template" }),
				name: "sessionId",
				required: true,
				options,
				value,
				error: errors.fieldErrors?.sessionId ?? null,
			},
		},
		formErrors: [
			...(errors.formErrors ?? []),
			...(errors.fieldErrors?.trainingDayId ? [errors.fieldErrors.trainingDayId] : []),
		],
		actions: {
			submit: {
				label: t("library.assignToDay", { defaultValue: "Assign to this day" }),
				disabled,
			},
		},
	};
}
