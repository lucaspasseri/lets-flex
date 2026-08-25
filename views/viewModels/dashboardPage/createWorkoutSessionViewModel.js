/** @param {Array<{stepLog: {status: string} | null}>} steps */
function percentage(steps) {
	return steps.length === 0
		? 0
		: (steps.filter((step) => step.stepLog?.status === "performed").length /
				steps.length) *
				100;
}

/** @param {{session: import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession | null, sessions: import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutSession[], daysDifference: number | null, workoutLogFormState?: any, actionFormState?: any}} input */
export default function createWorkoutSessionViewModel({
	session,
	sessions,
	daysDifference,
	workoutLogFormState,
	actionFormState,
}) {
	const steps = (session?.steps ?? []).map((step) => ({
		id: step.id,
		orderLabel: String(step.order).padStart(2, "0"),
		title: formatStepTitle(step),
		status: step.stepLog?.status ?? "planned",
		stepLog: step.stepLog,
	}));
	const performedPercentage = percentage(steps);
	const currentStep =
		steps.find((step) => step.stepLog?.id && step.status === "planned") ?? null;
	const hasWorkoutLogs = steps.some((step) => step.stepLog?.id);
	const status = session?.status ?? null;
	const showWorkoutLogs = Boolean(
		session && (status === "in_progress" || status === "finished") && steps.length > 0,
	);

	return {
		isRestDay: sessions.length === 0,
		hasMultipleSessions: sessions.length > 1,
		selectedId: session?.id ?? null,
		performedPercentage,
		selectors: sessions.map((item) => ({
			id: item.id,
			isActive: item.id === session?.id,
			href: `/?daysDifference=${daysDifference ?? 0}&workoutSessionId=${item.id}`,
		})),
		session: session
			? {
					id: session.id,
					header: {
						eyebrow: "CURRENT WORKOUT SESSION",
						title: session.name,
						statusLabel:
							status === "in_progress"
								? `${Math.round(performedPercentage)}% COMPLETE`
								: status === "finished"
									? "SESSION FINISHED"
									: status === "planned"
										? "SESSION NOT STARTED"
										: status === "cancelled"
											? "SESSION CANCELLED"
											: "NO STATUS",
					},
					steps,
					isEmpty: steps.length === 0,
					showWorkoutLogs,
					showStart: status === "planned",
					showFinish: status === "in_progress" && hasWorkoutLogs && !currentStep,
					showMissingLogs: status === "in_progress" && !hasWorkoutLogs,
					currentStep: currentStep
						? createCurrentStepViewModel(
								currentStep,
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

/** @param {import("../../../src/features/sessions/sessions.types.js").SessionMapperStep} step */
function formatStepTitle(step) {
	const baseName =
		step.name ?? step.exercise.name ?? step.exercise.variantName ?? "Step";
	return step.exercise.variantName && step.exercise.variantName !== baseName
		? `${baseName.toUpperCase()} (${step.exercise.variantName})`
		: baseName.toUpperCase();
}

/** @param {{title: string, stepLog: import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutStepLog | null}} step @param {number | null} daysDifference */
function createCurrentStepViewModel(step, daysDifference, workoutSessionId, formState) {
	const log = step.stepLog;
	if (!log) return null;
	const submittedRows = Array.isArray(formState?.values?.logFormRows)
		? formState.values.logFormRows
		: null;
	return {
		title: step.title,
		performAction: `/workout_step_logs/${log.id}/perform`,
		skipAction: `/workout_step_logs/${log.id}/skip`,
		daysDifference,
		workoutSessionId,
		errors: formState?.errors,
		rows: Array.from(
			{ length: submittedRows?.length ?? log.plannedSets ?? 0 },
			(_, index) =>
				createLogRow(
					log,
					index,
					submittedRows?.[index],
					formState?.errors?.fieldErrors,
				),
		),
		templateRow: createLogRow(log, "template"),
	};
}

/** @param {import("../../../src/features/workoutSessions/workoutSessions.types.js").WorkoutStepLog} log @param {number | "template"} index */
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
			},
			loadValue: {
				id: `${context}_performedLoadValue`,
				name: `${context}[performedLoadValue]`,
				label: "Load value",
				type: "number",
				value: submitted?.performedLoadValue ?? log.plannedLoadValue ?? "",
				error: errors[`logFormRows.${index}.performedLoadValue`] ?? null,
				hint: null,
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
	};
}
