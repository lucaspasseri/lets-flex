const MAX_SET_ROWS = 100;

/** @param {Array<{status: string}>} steps @param {(step: {status: string}) => boolean} predicate */
function percentage(steps, predicate) {
	return steps.length === 0 ? 0 : (steps.filter(predicate).length / steps.length) * 100;
}

/** @param {{session: import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession | null, sessions: import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession[], daysDifference: number | null, workoutLogFormState?: any, actionFormState?: any, workoutFeedback?: {tone: "error" | "success", title: string, message: string} | null}} input */
export default function createWorkoutSessionViewModel({
	session,
	sessions,
	daysDifference,
	workoutLogFormState,
	actionFormState,
	workoutFeedback = null,
}) {
	const status = session?.status ?? null;
	const steps = (session?.steps ?? []).map((step) => ({
		id: step.id,
		orderLabel: String(step.order).padStart(2, "0"),
		title: formatStepTitle(step),
		status: step.stepLog?.status ?? "planned",
		statusLabel: stepStatusLabel(step.stepLog?.status),
		stepLog: step.stepLog,
	}));
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
		positionLabel: `Step ${index + 1} of ${steps.length}`,
	}));
	const hasWorkoutLogs = steps.some((step) => step.stepLog?.id);
	const showWorkoutLogs = Boolean(
		session && (status === "in_progress" || status === "finished") && steps.length > 0,
	);
	const feedback =
		workoutFeedback ?? createValidationFeedback(workoutLogFormState, actionFormState);

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
					state: statusPresentation(status).modifier,
					header: {
						eyebrow: "CURRENT WORKOUT SESSION",
						title: session.name,
						statusLabel: statusPresentation(status).label,
						statusModifier: statusPresentation(status).modifier,
					},
					steps: presentedSteps,
					stepListLabel:
						status === "in_progress" || status === "finished"
							? "Workout steps"
							: "Planned steps",
					isEmpty: steps.length === 0,
					emptyState: createEmptyState(status),
					terminalState: createTerminalState(status, steps.length),
					progress: {
						isVisible:
							steps.length > 0 && (status === "in_progress" || status === "finished"),
						value: resolvedCount,
						max: steps.length,
						percentage: Math.round(resolvedPercentage),
						label: `${resolvedCount} of ${steps.length} steps resolved`,
						detail: `${performedCount} completed · ${skippedCount} skipped · ${steps.length - resolvedCount} remaining`,
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

function stepStatusLabel(status) {
	return (
		{
			planned: "Planned",
			performed: "Completed",
			skipped: "Skipped",
			in_progress: "Needs attention",
		}[status ?? "planned"] ?? "Status unavailable"
	);
}

function statusPresentation(status) {
	return (
		{
			planned: { label: "Ready to start", modifier: "planned" },
			in_progress: { label: "In progress", modifier: "in-progress" },
			finished: { label: "Finished", modifier: "finished" },
			cancelled: { label: "Cancelled", modifier: "cancelled" },
		}[status ?? ""] ?? { label: "Status unavailable", modifier: "unknown" }
	);
}

function createEmptyState(status) {
	return (
		{
			planned: {
				title: "No steps planned",
				message: "This session is empty, but you can still start and finish it.",
			},
			in_progress: {
				title: "Nothing to log",
				message: "This active session has no steps. Finish it when you are ready.",
			},
			finished: {
				title: "Finished without steps",
				message: "This session was completed without any recorded exercises.",
			},
			cancelled: {
				title: "Cancelled session",
				message: "No workout results were recorded for this session.",
			},
		}[status ?? ""] ?? {
			title: "No workout steps",
			message: "There are no steps to show for this session.",
		}
	);
}

function createTerminalState(status, stepCount) {
	if (status === "finished") {
		return {
			tone: "success",
			title: "Workout complete",
			message:
				stepCount === 0
					? "This session was finished without any workout steps."
					: "Every workout step has a recorded result.",
		};
	}
	if (status === "cancelled") {
		return {
			tone: "neutral",
			title: "Session cancelled",
			message: "This planned workout is closed and cannot be started.",
		};
	}
	return null;
}

function createValidationFeedback(workoutLogFormState, actionFormState) {
	if (workoutLogFormState?.errors) {
		return {
			tone: "error",
			title: "Step not saved",
			message: "Check the highlighted set details and try again.",
		};
	}
	if (actionFormState?.errors) {
		return {
			tone: "error",
			title: "Workout not updated",
			message: "Check the workout action and try again.",
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

/** @param {{title: string, stepLog: import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutStepLog | null}} step @param {number} position @param {number} stepCount @param {number | null} daysDifference */
function createCurrentStepViewModel(
	step,
	position,
	stepCount,
	daysDifference,
	workoutSessionId,
	formState,
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
		createLogRow(log, index, submittedRows?.[index], formState?.errors?.fieldErrors),
	);
	return {
		title: step.title,
		positionLabel: `Step ${position} of ${stepCount}`,
		formId: `workout-step-log-${log.id}`,
		performAction: `/workout_step_logs/${log.id}/perform`,
		skipAction: `/workout_step_logs/${log.id}/skip`,
		daysDifference,
		workoutSessionId,
		errors: formState?.errors,
		maxRows: MAX_SET_ROWS,
		rows: rows.map((row) => ({ ...row, canRemove: rows.length > 1 })),
		templateRow: createLogRow(log, "template"),
	};
}

/** @param {import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutStepLog} log @param {number | "template"} index @param {any} [submitted] @param {Record<string, string>} [errors] */
function createLogRow(log, index, submitted = undefined, errors = {}) {
	const context = `logFormRows[${index}]`;
	return {
		index,
		title: typeof index === "number" ? `Set ${index + 1}` : "Set",
		fields: {
			reps: {
				id: `${context}_performedReps`,
				name: `${context}[performedReps]`,
				label: "Reps",
				type: "number",
				value: submitted?.performedReps ?? log.plannedReps ?? "",
				error: errors[`logFormRows.${index}.performedReps`] ?? null,
				hint: null,
				attributes: { min: 0, max: 10000, step: 1, inputmode: "numeric" },
			},
			loadValue: {
				id: `${context}_performedLoadValue`,
				name: `${context}[performedLoadValue]`,
				label: "Load value",
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
				label: "Load unit",
				control: "select",
				required: true,
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
