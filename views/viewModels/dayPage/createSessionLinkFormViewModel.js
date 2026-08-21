/**
 * @typedef {import("../../../src/features/sessions/sessions.types.js").SessionMapper} Session
 * @param {{currentDayId: number | null, sessions: Session[]}} input
 */
export default function createSessionLinkFormViewModel({ currentDayId, sessions }) {
	const options = sessions
		.filter(session => !session.isArchived)
		.map(session => ({ label: session.name, value: session.id }));
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
			},
		},
		actions: { submit: { label: "Submit", disabled } },
	};
}
