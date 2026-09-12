import formatStepLoadLabel from "../../../src/features/sessions/formatStepLoadLabel.js";
import { resolveMedia } from "../../../src/features/media/resolveMedia.js";
import resolveStepMedia from "../../../src/features/media/resolveStepMedia.js";
import createViewModelTranslator, { translateCount } from "../translate.js";

/**
 * @typedef {import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession} WorkoutSession
 * @typedef {import("../../../src/features/sessions/sessions.types.js").SessionMapperStep} SessionStep
 * @param {{currentDayId: number | null, workoutSessions: WorkoutSession[], language?: string, translate?: Function}} input
 */
export default function createWorkoutSessionListViewModel({
	currentDayId,
	workoutSessions,
	language = "en",
	translate,
}) {
	const t = createViewModelTranslator(translate);
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
				media: session.steps[0]
					? resolveMedia({
							entityType: "session",
							label: session.name,
							presentation: "initial",
						})
					: null,
				statusLabel: session.status,
				...(canCancel
					? {
							modalId: `deleteWorkoutSessionId-${session.id}`,
							deleteActionLabel: t("workout.deleteWorkoutSession", {
								name: session.name,
								defaultValue: "Delete {{name}}",
							}),
						}
					: {}),
			},
			steps: session.steps.map((step) =>
				toStepViewModel(step, language, t, translate ?? t),
			),
		};
	});
	const cancellableSessions = visibleSessions.filter(
		(session) => session.status === "planned",
	);

	return {
		count: items.length,
		countLabel: translateCount(
			translate,
			"dashboard.sessionsAssignedSentence",
			items.length,
			{
				one: "{{count}} session is assigned to this training day.",
				other: "{{count}} sessions are assigned to this training day.",
			},
		),
		emptyState: {
			isVisible: items.length === 0,
			title: t("dashboard.noSessionAssigned", {
				defaultValue: "No session assigned yet",
			}),
			description: t("dashboard.assignSessionDescription", {
				defaultValue:
					"Assign an existing session template or create one for this training day.",
			}),
		},
		items,
		cancelModals: cancellableSessions.map((session) => ({
			id: `deleteWorkoutSessionId-${session.id}`,
			title: t("workout.deleteWorkoutTitle", {
				defaultValue: "Delete the workout session",
			}),
			form: {
				action: `/workout_sessions/${session.id}?_method=PATCH`,
				method: "POST",
				trainingDayId: currentDayId,
				submitLabel: t("workout.confirmDelete", { defaultValue: "Confirm delete" }),
			},
		})),
	};
}

/** @param {SessionStep} step @param {string} language @param {Function} t @param {Function} translate */
function toStepViewModel(step, language, t, translate) {
	const title = step.exercise.variantName || step.exercise.name || step.name;

	return {
		id: step.id,
		orderLabel: String(step.order).padStart(2, "0"),
		title: `${title}:`,
		prescriptionLabel: t("workout.prescription", {
			sets: translateCount(translate, "workout.sets", step.sets, {
				one: "{{count}} set",
				other: "{{count}} sets",
			}),
			reps: translateCount(translate, "workout.reps", step.reps, {
				one: "{{count}} rep",
				other: "{{count}} reps",
			}),
			defaultValue: "{{sets}} × {{reps}}",
		}),
		loadLabel: formatStepLoadLabel({
			loadValue: step.loadValue,
			loadUnit: step.loadUnit,
			equipmentName: step.equipment.name,
			language,
		}),
		media: resolveStepMedia(step, { presentation: "initial" }),
		details: [step.equipment.name, step.movementPattern].filter(Boolean),
	};
}
