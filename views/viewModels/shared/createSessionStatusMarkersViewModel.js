import createViewModelTranslator from "../translate.js";

/**
 * Shared presentation rules for workout-session markers.
 *
 * planned: neutral gray; in_progress: coral; finished: green;
 * cancelled: red; missing/unrecognized: outlined gray.
 *
 * @param {Pick<import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession, "id" | "status">[]} sessions
 * @param {Function} [translate]
 */

export default function createSessionStatusMarkersViewModel(sessions, translate) {
	const t = createViewModelTranslator(translate);
	const statusPresentation = {
		planned: {
			label: t("dashboard.planned", { defaultValue: "Planned" }),
			modifier: "planned",
		},
		in_progress: {
			label: t("dashboard.inProgress", { defaultValue: "In progress" }),
			modifier: "in-progress",
		},
		finished: {
			label: t("dashboard.finished", { defaultValue: "Finished" }),
			modifier: "finished",
		},
		cancelled: {
			label: t("dashboard.cancelled", { defaultValue: "Cancelled" }),
			modifier: "cancelled",
		},
	};
	const unknownPresentation = {
		label: t("dashboard.statusUnknown", { defaultValue: "Status unknown" }),
		modifier: "unknown",
	};
	const items = sessions.map((session) => {
		const presentation = statusPresentation[session.status] ?? unknownPresentation;

		return {
			id: session.id,
			label: presentation.label,
			title: t("dashboard.workoutSessionTitle", {
				status: presentation.label,
				defaultValue: "Workout session: {{status}}",
			}),
			className: `session-status-marker session-status-marker--${presentation.modifier}`,
		};
	});

	return {
		items,
		accessibleLabel:
			items.length === 0
				? t("dashboard.noSessionsPlanned", {
						defaultValue: "No workout sessions planned",
					})
				: `${t("dashboard.workoutSessionsCount", { count: items.length, defaultValue: "{{count}} workout sessions" })}: ${items.map((item) => item.label).join(", ")}`,
	};
}
