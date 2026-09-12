import formatStepLoadLabel from "../../../src/features/sessions/formatStepLoadLabel.js";
import { resolveMedia } from "../../../src/features/media/resolveMedia.js";
import resolveStepMedia from "../../../src/features/media/resolveStepMedia.js";
import createViewModelTranslator from "../translate.js";

const MAX_SET_ROWS = 100;

/** @param {Array<{status: string}>} steps @param {(step: {status: string}) => boolean} predicate */
function percentage(steps, predicate) {
	return steps.length === 0 ? 0 : (steps.filter(predicate).length / steps.length) * 100;
}

/** @param {{session: import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession | null, sessions: import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession[], daysDifference: number | null, workoutLogFormState?: any, actionFormState?: any, workoutFeedback?: {tone: "error" | "success", title: string, message: string} | null, translate?: Function}} input */
export default function createWorkoutSessionViewModel({
	session,
	sessions,
	daysDifference,
	workoutLogFormState,
	actionFormState,
	workoutFeedback = null,
	translate,
}) {
	const t = createViewModelTranslator(translate);
	const status = session?.status ?? null;
	const steps = (session?.steps ?? []).map((step) => ({
		...step,
		id: step.id,
		orderLabel: String(step.order).padStart(2, "0"),
		title: formatStepTitle(step),
		status: step.stepLog?.status ?? "planned",
		statusLabel: stepStatusLabel(step.stepLog?.status, t),
		stepLog: step.stepLog,
		media: resolveStepMedia(step, { presentation: "initial" }),
	}));
	const sessionMedia =
		session && steps.length > 0
			? resolveMedia({
					entityType: "session",
					label: session.name,
					presentation: "initial",
				})
			: null;
	const performedCount = steps.filter((step) => step.status === "performed").length;
	const skippedCount = steps.filter((step) => step.status === "skipped").length;
	const resolvedCount = performedCount + skippedCount;
	const performedPercentage = percentage(steps, (step) => step.status === "performed");
	const resolvedPercentage = percentage(
		steps,
		(step) => step.status === "performed" || step.status === "skipped",
	);
	const currentStep =
		status === "in_progress"
			? (steps.find((step) => step.stepLog?.id && step.status === "planned") ?? null)
			: null;
	const presentedSteps = steps.map((step, index) => ({
		...step,
		isCurrent: step.id === currentStep?.id,
		positionLabel: t("workout.stepPosition", {
			position: index + 1,
			total: steps.length,
			defaultValue: "Step {{position}} of {{total}}",
		}),
		prescriptionLabel: t("workout.prescription", {
			sets: step.sets,
			reps: step.reps,
			defaultValue: "{{sets}} sets × {{reps}} reps",
		}),
		loadLabel: formatStepLoadLabel({
			loadValue: step.loadValue,
			loadUnit: step.loadUnit,
			equipmentName: step.equipment.name,
		}),
	}));
	const hasWorkoutLogs = steps.some((step) => step.stepLog?.id);
	const showWorkoutLogs = Boolean(
		session && (status === "in_progress" || status === "finished") && steps.length > 0,
	);
	const feedback =
		workoutFeedback ??
		createValidationFeedback(workoutLogFormState, actionFormState, t);

	return {
		isRestDay: sessions.length === 0,
		hasMultipleSessions: sessions.length > 1,
		selectedId: session?.id ?? null,
		performedPercentage,
		feedback,
		selectors: sessions.map((item) => ({
			id: item.id,
			isActive: item.id === session?.id,
			href: `/?daysDifference=${daysDifference ?? 0}&workoutSessionId=${item.id}`,
		})),
		session: session
			? {
					id: session.id,
					state: statusPresentation(status, t).modifier,
					header: {
						eyebrow: "CURRENT WORKOUT SESSION",
						title: session.name,
						statusLabel: statusPresentation(status, t).label,
						statusModifier: statusPresentation(status, t).modifier,
						media: sessionMedia,
					},
					steps: presentedSteps,
					stepListLabel:
						status === "in_progress" || status === "finished"
							? t("workout.workoutSteps", { defaultValue: "Workout steps" })
							: t("workout.plannedSteps", { defaultValue: "Planned steps" }),
					isEmpty: steps.length === 0,
					emptyState: createEmptyState(status, t),
					terminalState: createTerminalState(status, steps.length, t),
					progress: {
						isVisible:
							steps.length > 0 && (status === "in_progress" || status === "finished"),
						value: resolvedCount,
						max: steps.length,
						percentage: Math.round(resolvedPercentage),
						label: t("workout.stepsResolved", {
							resolved: resolvedCount,
							total: steps.length,
							defaultValue: "{{resolved}} of {{total}} steps resolved",
						}),
						detail: t("workout.progressDetail", {
							performed: performedCount,
							skipped: skippedCount,
							remaining: steps.length - resolvedCount,
							defaultValue:
								"{{performed}} completed · {{skipped}} skipped · {{remaining}} remaining",
						}),
					},
					showWorkoutLogs,
					showStart: status === "planned",
					showFinish:
						status === "in_progress" &&
						!currentStep &&
						(steps.length === 0 || (hasWorkoutLogs && resolvedCount === steps.length)),
					showMissingLogs:
						status === "in_progress" &&
						steps.length > 0 &&
						(!hasWorkoutLogs || (!currentStep && resolvedCount < steps.length)),
					currentStep: currentStep
						? createCurrentStepViewModel(
								currentStep,
								presentedSteps.findIndex((step) => step.isCurrent) + 1,
								steps.length,
								daysDifference,
								session.id,
								workoutLogFormState ?? actionFormState,
								t,
							)
						: null,
					startForm: {
						action: `/workout_sessions/${session.id}/start`,
						daysDifference,
						errors: actionFormState?.errors,
					},
					finishForm: {
						action: `/workout_sessions/${session.id}/finish`,
						daysDifference,
						errors: actionFormState?.errors,
					},
				}
			: null,
	};
}

function stepStatusLabel(status, t) {
	return (
		{
			planned: t("workout.planned", { defaultValue: "Planned" }),
			performed: t("workout.performed", { defaultValue: "Completed" }),
			skipped: t("workout.skipped", { defaultValue: "Skipped" }),
			in_progress: t("workout.inProgress", { defaultValue: "Needs attention" }),
		}[status ?? "planned"] ??
		t("workout.statusUnavailable", { defaultValue: "Status unavailable" })
	);
}

function statusPresentation(status, t) {
	return (
		{
			planned: {
				label: t("workout.readyToStart", { defaultValue: "Ready to start" }),
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
		}[status ?? ""] ?? {
			label: t("workout.statusUnavailable", { defaultValue: "Status unavailable" }),
			modifier: "unknown",
		}
	);
}

function createEmptyState(status, t) {
	return (
		{
			planned: {
				title: t("workout.noStepsPlanned", { defaultValue: "No steps planned" }),
				message: t("workout.emptyPlannedMessage", {
					defaultValue: "This session is empty, but you can still start and finish it.",
				}),
			},
			in_progress: {
				title: t("workout.nothingToLog", { defaultValue: "Nothing to log" }),
				message: t("workout.emptyActiveMessage", {
					defaultValue:
						"This active session has no steps. Finish it when you are ready.",
				}),
			},
			finished: {
				title: t("workout.finishedWithoutSteps", {
					defaultValue: "Finished without steps",
				}),
				message: t("workout.emptyFinishedMessage", {
					defaultValue: "This session was completed without any recorded exercises.",
				}),
			},
			cancelled: {
				title: t("workout.cancelledSession", { defaultValue: "Cancelled session" }),
				message: t("workout.emptyCancelledMessage", {
					defaultValue: "No workout results were recorded for this session.",
				}),
			},
		}[status ?? ""] ?? {
			title: t("workout.noWorkoutSteps", { defaultValue: "No workout steps" }),
			message: t("workout.noWorkoutStepsMessage", {
				defaultValue: "There are no steps to show for this session.",
			}),
		}
	);
}

function createTerminalState(status, stepCount, t) {
	if (status === "finished") {
		return {
			tone: "success",
			title: t("workout.workoutComplete", { defaultValue: "Workout complete" }),
			message:
				stepCount === 0
					? t("workout.finishedWithoutWorkoutSteps", {
							defaultValue: "This session was finished without any workout steps.",
						})
					: t("workout.everyStepResolved", {
							defaultValue: "Every workout step has a recorded result.",
						}),
		};
	}
	if (status === "cancelled") {
		return {
			tone: "neutral",
			title: t("workout.sessionCancelled", { defaultValue: "Session cancelled" }),
			message: t("workout.cancelledMessage", {
				defaultValue: "This planned workout is closed and cannot be started.",
			}),
		};
	}
	return null;
}

function createValidationFeedback(workoutLogFormState, actionFormState, t) {
	if (workoutLogFormState?.errors) {
		return {
			tone: "error",
			title: t("workout.stepNotSaved", { defaultValue: "Step not saved" }),
			message: t("workout.checkSetDetails", {
				defaultValue: "Check the highlighted set details and try again.",
			}),
		};
	}
	if (actionFormState?.errors) {
		return {
			tone: "error",
			title: t("workout.workoutNotUpdated", { defaultValue: "Workout not updated" }),
			message: t("workout.checkWorkoutAction", {
				defaultValue: "Check the workout action and try again.",
			}),
		};
	}
	return null;
}

/** @param {import("../../../src/features/sessions/sessions.types.js").SessionMapperStep} step */
function formatStepTitle(step) {
	const baseName =
		step.name ?? step.exercise.name ?? step.exercise.variantName ?? "Step";
	return step.exercise.variantName && step.exercise.variantName !== baseName
		? `${baseName.toUpperCase()} (${step.exercise.variantName})`
		: baseName.toUpperCase();
}

/**
 * @param {import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSessionStep & {title: string, media: import("../../../src/features/media/media.types.js").ResolvedMedia}} step
 * @param {number} position
 * @param {number} stepCount
 * @param {number | null} daysDifference
 * @param {number} workoutSessionId
 * @param {any} formState
 */
function createCurrentStepViewModel(
	step,
	position,
	stepCount,
	daysDifference,
	workoutSessionId,
	formState,
	t,
) {
	const log = step.stepLog;
	if (!log) return null;
	const submittedRows = Array.isArray(formState?.values?.logFormRows)
		? formState.values.logFormRows.slice(0, MAX_SET_ROWS)
		: null;
	const rowCount = Math.max(
		1,
		Math.min(MAX_SET_ROWS, submittedRows?.length ?? log.plannedSets ?? 1),
	);
	const rows = Array.from({ length: rowCount }, (_, index) =>
		createLogRow(log, index, submittedRows?.[index], formState?.errors?.fieldErrors, t),
	);
	return {
		title: step.title,
		media: step.media,
		loadGuidance: formatStepLoadLabel({
			loadValue: log.plannedLoadValue,
			loadUnit: log.plannedLoadUnit,
			equipmentName: step.equipment.name,
		}),
		positionLabel: t("workout.stepPosition", {
			position,
			total: stepCount,
			defaultValue: "Step {{position}} of {{total}}",
		}),
		formId: `workout-step-log-${log.id}`,
		performAction: `/workout_step_logs/${log.id}/perform`,
		skipAction: `/workout_step_logs/${log.id}/skip`,
		daysDifference,
		workoutSessionId,
		errors: formState?.errors,
		maxRows: MAX_SET_ROWS,
		rows: rows.map((row) => ({ ...row, canRemove: rows.length > 1 })),
		templateRow: createLogRow(log, "template", undefined, {}, t),
	};
}

/** @param {import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutStepLog} log @param {number | "template"} index @param {any} [submitted] @param {Record<string, string>} [errors] */
function createLogRow(
	log,
	index,
	submitted = undefined,
	errors = {},
	t = (key, options) => options?.defaultValue ?? key,
) {
	const context = `logFormRows[${index}]`;
	return {
		index,
		title: t("history.setCount", {
			count: typeof index === "number" ? index + 1 : 1,
			defaultValue: "Set {{count}}",
		}),
		fields: {
			reps: {
				id: `${context}_performedReps`,
				name: `${context}[performedReps]`,
				label: t("workout.reps", { defaultValue: "Reps" }),
				type: "number",
				value: submitted?.performedReps ?? log.plannedReps ?? "",
				error: errors[`logFormRows.${index}.performedReps`] ?? null,
				hint: null,
				attributes: { min: 0, max: 10000, step: 1, inputmode: "numeric" },
			},
			loadValue: {
				id: `${context}_performedLoadValue`,
				name: `${context}[performedLoadValue]`,
				label: t("workout.loadValue", { defaultValue: "Load value" }),
				type: "number",
				value: submitted?.performedLoadValue ?? log.plannedLoadValue ?? "",
				error: errors[`logFormRows.${index}.performedLoadValue`] ?? null,
				hint: null,
				attributes: {
					min: 0,
					max: 1000000,
					step: "any",
					inputmode: "decimal",
				},
			},
			loadUnit: {
				id: `${context}_performedLoadUnit`,
				name: `${context}[performedLoadUnit]`,
				label: t("workout.loadUnit", { defaultValue: "Load unit" }),
				control: "select",
				required: false,
				value: submitted?.performedLoadUnit ?? log.plannedLoadUnit ?? "",
				error: errors[`logFormRows.${index}.performedLoadUnit`] ?? null,
				hint: null,
				options: [
					{ label: "Kg", value: "Kilograms" },
					{ label: "lb", value: "Libra" },
				],
			},
		},
		canRemove: true,
	};
}
