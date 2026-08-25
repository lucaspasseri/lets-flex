const STATUS_PRESENTATION = {
	planned: { label: "Planned", modifier: "planned" },
	in_progress: { label: "In progress", modifier: "in-progress" },
	finished: { label: "Finished", modifier: "finished" },
	cancelled: { label: "Cancelled", modifier: "cancelled" },
};

const UNKNOWN_PRESENTATION = { label: "Status unknown", modifier: "unknown" };

/**
 * Shared presentation rules for workout-session markers.
 *
 * planned: neutral gray; in_progress: coral; finished: green;
 * cancelled: red; missing/unrecognized: outlined gray.
 *
 * @param {Pick<import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession, "id" | "status">[]} sessions
 */
export default function createSessionStatusMarkersViewModel(sessions) {
	const items = sessions.map((session) => {
		const presentation = STATUS_PRESENTATION[session.status] ?? UNKNOWN_PRESENTATION;

		return {
			id: session.id,
			label: presentation.label,
			title: `Workout session: ${presentation.label}`,
			className: `session-status-marker session-status-marker--${presentation.modifier}`,
		};
	});

	return {
		items,
		accessibleLabel:
			items.length === 0
				? "No workout sessions planned"
				: `${items.length} workout ${items.length === 1 ? "session" : "sessions"}: ${items.map((item) => item.label).join(", ")}`,
	};
}
