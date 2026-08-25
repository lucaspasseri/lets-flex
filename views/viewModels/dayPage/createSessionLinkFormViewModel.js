/**
 * @typedef {import("../../../src/features/sessions/sessions.types.js").SessionMapper} Session
 * @param {{currentDayId: number | null, sessions: Session[], state?: Record<string, any>}} input
 */
export default function createSessionLinkFormViewModel({
	currentDayId,
	sessions,
	state = {},
}) {
	const values = state?.values && typeof state.values === "object" ? state.values : {};
	const errors = state?.errors ?? { fieldErrors: {}, formErrors: [] };
	const options = sessions
		.filter((session) => !session.isArchived)
		.map((session) => ({ label: session.name, value: session.id }));
	const disabled = currentDayId === null || options.length === 0;

	return {
		isEnabled: !disabled,
		action: "/workout_sessions",
		method: "POST",
		fields: {
			trainingDayId: currentDayId,
			session: {
				id: "sessionSelect",
				label: "Session template",
				name: "sessionId",
				required: true,
				options,
				value: typeof values.sessionId === "string" ? values.sessionId : "",
				error: errors.fieldErrors?.sessionId ?? null,
			},
		},
		formErrors: [
			...(errors.formErrors ?? []),
			...(errors.fieldErrors?.trainingDayId ? [errors.fieldErrors.trainingDayId] : []),
		],
		actions: { submit: { label: "Submit", disabled } },
	};
}
