function formatDate(dateKey) {
	if (!dateKey) return "Date unavailable";
	const date = new Date(`${dateKey}T00:00:00.000Z`);
	return Number.isNaN(date.valueOf())
		? "Date unavailable"
		: new Intl.DateTimeFormat("en", {
				dateStyle: "medium",
				timeZone: "UTC",
			}).format(date);
}

function toIsoTimestamp(value) {
	if (!value) return null;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function formatTimestamp(value) {
	const iso = toIsoTimestamp(value);
	return iso
		? `${new Intl.DateTimeFormat("en", {
				dateStyle: "medium",
				timeStyle: "short",
				timeZone: "UTC",
			}).format(new Date(iso))} UTC`
		: "Not recorded";
}

function appendFilters(parameters, filters) {
	if (filters.programId) parameters.set("programId", String(filters.programId));
	if (filters.fromDate) parameters.set("fromDate", filters.fromDate);
	if (filters.toDate) parameters.set("toDate", filters.toDate);
	return parameters;
}

function historyUrl(filters, page = 1) {
	const parameters = appendFilters(new URLSearchParams(), filters);
	if (page > 1) parameters.set("page", String(page));
	const query = parameters.toString();
	return query ? `/history?${query}` : "/history";
}

function detailUrl(id, filters, page) {
	const parameters = appendFilters(new URLSearchParams(), filters);
	if (page > 1) parameters.set("page", String(page));
	const query = parameters.toString();
	return `/history/${id}${query ? `?${query}` : ""}`;
}

/**
 * @param {{page: Record<string, unknown>, data: {currentUser: import("../../../src/features/users/users.types.js").User | null, programs: import("../../../src/features/programs/programs.types.js").Program[], history: import("../../../src/features/workoutHistory/workoutHistory.types.js").WorkoutHistoryPage}, filters: import("../../../src/features/workoutHistory/workoutHistory.types.js").WorkoutHistoryFilters}} input
 */
export function createWorkoutHistoryListPageViewModel({ page, data, filters }) {
	const hasFilters = Boolean(filters.programId || filters.fromDate || filters.toDate);
	const programOptions = data.programs.map((program) => ({
		value: program.id,
		label: program.name || "Unnamed program",
	}));
	if (
		filters.programId &&
		!programOptions.some((option) => option.value === filters.programId)
	) {
		programOptions.push({ value: filters.programId, label: "Unavailable program" });
	}
	const items = data.history.items.map((item) => ({
		id: item.id,
		href: detailUrl(item.id, filters, data.history.page),
		title: item.sessionName,
		programName: item.programName ?? "Unnamed program",
		status: item.status,
		statusLabel: item.status === "cancelled" ? "Cancelled" : "Finished",
		historyDate: {
			value: item.historyDate,
			label: formatDate(item.historyDate),
			context: item.status === "finished" ? "Completed" : "Scheduled",
		},
		scheduledDate:
			item.status === "finished" && item.scheduledDate
				? { value: item.scheduledDate, label: formatDate(item.scheduledDate) }
				: null,
		stepSummary: `${item.performedStepCount} completed · ${item.skippedStepCount} skipped · ${item.stepCount} total`,
		stepCounts: [
			{ label: "Completed", value: item.performedStepCount },
			{ label: "Skipped", value: item.skippedStepCount },
			{ label: "Total", value: item.stepCount },
		],
	}));

	return {
		page: { ...page, title: "Workout history · Let's Flex!" },
		shell: { currentUser: data.currentUser, activeNavigation: "history" },
		heading: {
			eyebrow: "Training record",
			title: "Workout history",
			description: "Review finished and cancelled sessions from your programs.",
			meta: `${data.history.totalCount} ${data.history.totalCount === 1 ? "session" : "sessions"}`,
		},
		filters: {
			action: "/history",
			values: filters,
			programOptions,
			clearHref: "/history",
			hasFilters,
		},
		results: {
			items,
			empty: {
				title: hasFilters
					? "No sessions match these filters"
					: "No workout history yet",
				message: hasFilters
					? "Change or clear the filters to see other terminal sessions."
					: "Finished and cancelled sessions will appear here.",
			},
		},
		pagination: {
			page: data.history.page,
			totalPages: data.history.totalPages,
			previousHref:
				data.history.page > 1 ? historyUrl(filters, data.history.page - 1) : null,
			nextHref:
				data.history.page < data.history.totalPages
					? historyUrl(filters, data.history.page + 1)
					: null,
			firstHref:
				items.length === 0 && data.history.totalCount > 0 ? historyUrl(filters) : null,
		},
	};
}

/**
 * @param {{page: Record<string, unknown>, currentUser: import("../../../src/features/users/users.types.js").User | null, state: "not-found" | "failure"}} input
 */
export function createWorkoutHistoryStatePageViewModel({ page, currentUser, state }) {
	const notFound = state === "not-found";
	return {
		page: {
			...page,
			title: `${notFound ? "Workout not found" : "History unavailable"} · Let's Flex!`,
		},
		shell: { currentUser, activeNavigation: "history" },
		state: {
			kind: state,
			eyebrow: notFound ? "Workout history" : "Temporary problem",
			title: notFound ? "Workout not found" : "History is unavailable",
			message: notFound
				? "This workout is unavailable. It may not exist or may not belong to this account."
				: "We couldn't load workout history right now. Your workout data has not been changed.",
			actionLabel: notFound ? "Return to workout history" : "Try workout history again",
			actionHref: "/history",
		},
	};
}

function stepTitle(step) {
	return (
		step.exerciseVariantName ?? step.exerciseName ?? step.name ?? `Step ${step.order}`
	);
}

/** @param {import("../../../src/features/workoutHistory/workoutHistory.types.js").WorkoutHistoryStep} step */
function toStepViewModel(step) {
	return {
		id: step.id,
		order: step.order,
		title: stepTitle(step),
		exerciseName:
			step.exerciseName && step.exerciseName !== stepTitle(step)
				? step.exerciseName
				: null,
		name: step.name && step.name !== stepTitle(step) ? step.name : null,
		stepTypeName: step.stepTypeName,
		statusLabel:
			step.status === "performed"
				? "Completed"
				: step.status === "skipped"
					? "Skipped"
					: "Recorded",
		planned: {
			sets: step.plannedSets,
			reps: step.plannedReps,
			loadValue: step.plannedLoadValue,
			loadUnit: step.plannedLoadUnit,
		},
		completedAt: {
			value: toIsoTimestamp(step.completedAt),
			label: formatTimestamp(step.completedAt),
		},
		notes: step.notes,
		sets: step.sets,
	};
}

/**
 * @param {{page: Record<string, unknown>, currentUser: import("../../../src/features/users/users.types.js").User | null, history: import("../../../src/features/workoutHistory/workoutHistory.types.js").WorkoutHistoryDetail, returnFilters: import("../../../src/features/workoutHistory/workoutHistory.types.js").WorkoutHistoryFilters, returnPage: number}} input
 */
export function createWorkoutHistoryDetailPageViewModel({
	page,
	currentUser,
	history,
	returnFilters,
	returnPage,
}) {
	return {
		page: { ...page, title: `${history.sessionName} · Workout history · Let's Flex!` },
		shell: { currentUser, activeNavigation: "history" },
		backHref: historyUrl(returnFilters, returnPage),
		heading: {
			eyebrow: "Workout history",
			title: history.sessionName,
			description: history.programName ?? "Unnamed program",
			meta: history.status === "cancelled" ? "Cancelled" : "Finished",
		},
		summary: {
			status: history.status,
			statusLabel: history.status === "cancelled" ? "Cancelled" : "Finished",
			historyDate: {
				value: history.historyDate,
				label: formatDate(history.historyDate),
				context: history.status === "finished" ? "Completed" : "Scheduled",
			},
			scheduledDate:
				history.status === "finished" && history.scheduledDate
					? { value: history.scheduledDate, label: formatDate(history.scheduledDate) }
					: null,
			startedAt: {
				value: toIsoTimestamp(history.startedAt),
				label: formatTimestamp(history.startedAt),
			},
			finishedAt: {
				value: toIsoTimestamp(history.finishedAt),
				label: formatTimestamp(history.finishedAt),
			},
			notes: history.notes,
		},
		steps: history.steps.map(toStepViewModel),
		emptySteps: {
			title:
				history.status === "cancelled" ? "No workout results" : "No exercises recorded",
			message:
				history.status === "cancelled"
					? "This session was cancelled before exercise results were recorded."
					: "This workout was finished without exercise steps.",
		},
	};
}
