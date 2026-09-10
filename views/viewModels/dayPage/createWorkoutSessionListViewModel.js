/**
 * @typedef {import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession} WorkoutSession
 * @typedef {import("../../../src/features/sessions/sessions.types.js").SessionMapperStep} SessionStep
 * @param {{currentDayId: number | null, workoutSessions: WorkoutSession[]}} input
 */
export default function createWorkoutSessionListViewModel({
	currentDayId,
	workoutSessions,
}) {
	const visibleSessions = workoutSessions.filter(
		(session) => session.status !== "cancelled",
	);
	const items = visibleSessions.map((session) => {
		const canCancel = session.status === "planned";

		return {
			id: session.id,
			type: "workout",
			header: {
				title: session.name,
				notes: session.notes ?? session.sessionNotes,
				statusLabel: session.status,
				...(canCancel
					? {
							modalId: `deleteWorkoutSessionId-${session.id}`,
							deleteActionLabel: `Delete ${session.name}`,
						}
					: {}),
			},
			steps: session.steps.map(toStepViewModel),
		};
	});
	const cancellableSessions = visibleSessions.filter(
		(session) => session.status === "planned",
	);

	return {
		count: items.length,
		countLabel:
			items.length === 1
				? "1 session is assigned to this training day."
				: `${items.length} sessions are assigned to this training day.`,
		emptyState: {
			isVisible: items.length === 0,
			title: "No session assigned yet",
			description:
				"Assign an existing session template or create one for this training day.",
		},
		items,
		cancelModals: cancellableSessions.map((session) => ({
			id: `deleteWorkoutSessionId-${session.id}`,
			title: "Delete the workout session",
			form: {
				action: `/workout_sessions/${session.id}?_method=PATCH`,
				method: "POST",
				trainingDayId: currentDayId,
				submitLabel: "Confirm delete",
			},
		})),
	};
}

/** @param {SessionStep} step */
function toStepViewModel(step) {
	const title = step.exercise.variantName || step.exercise.name || step.name;
	const hasLoad = step.loadValue !== null && step.loadValue !== undefined;

	return {
		id: step.id,
		orderLabel: String(step.order).padStart(2, "0"),
		title: `${title}:`,
		prescriptionLabel: `${step.sets} sets × ${step.reps} reps`,
		loadLabel: hasLoad
			? [step.loadValue, step.loadUnit].filter(Boolean).join(" ")
			: null,
		details: [step.equipment.name, step.movementPattern].filter(Boolean),
	};
}
