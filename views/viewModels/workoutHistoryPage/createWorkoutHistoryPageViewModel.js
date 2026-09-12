import createViewModelTranslator, { translateCount } from "../translate.js";
import {
	formatLocaleDate,
	formatLocaleNumber,
	formatMeasurementSymbol,
} from "../../../src/infrastructure/i18n/formatLocale.js";

/** @param {string | null | undefined} dateKey @param {string} [language] @param {Function} [translate] */
function formatDate(dateKey, language = "en", translate) {
	const t =
		typeof translate === "function"
			? translate
			: (_key, options) => options?.defaultValue ?? _key;
	if (!dateKey)
		return t("history.dateUnavailable", { defaultValue: "Date unavailable" });
	return formatLocaleDate(dateKey, language, { dateStyle: "medium" }) === null
		? t("history.dateUnavailable", { defaultValue: "Date unavailable" })
		: formatLocaleDate(dateKey, language, { dateStyle: "medium" });
}

function toIsoTimestamp(value) {
	if (!value) return null;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

/** @param {string | Date | null | undefined} value @param {string} [language] @param {Function} [translate] */
function formatTimestamp(value, language = "en", translate) {
	const t =
		typeof translate === "function"
			? translate
			: (_key, options) => options?.defaultValue ?? _key;
	const iso = toIsoTimestamp(value);
	const label = formatLocaleDate(iso, language, {
		dateStyle: "medium",
		timeStyle: "short",
	});
	return label
		? `${label} UTC`
		: t("history.notRecorded", { defaultValue: "Not recorded" });
}

function formatLoadLabel(value, unit, language = "en") {
	if (value === null || value === undefined) return null;
	if (!unit) return formatLocaleNumber(value, language, { maximumFractionDigits: 2 });
	return `${formatLocaleNumber(value, language, { maximumFractionDigits: 2 })} ${formatMeasurementSymbol(unit)}`;
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
 * @param {{page: Record<string, unknown>, data: {currentUser: import("../../../src/features/users/users.types.js").User | null, programs: import("../../../src/features/programs/programs.types.js").Program[], history: import("../../../src/features/workoutHistory/workoutHistory.types.js").WorkoutHistoryPage}, filters: import("../../../src/features/workoutHistory/workoutHistory.types.js").WorkoutHistoryFilters, translate?: Function, language?: string}} input
 */
export function createWorkoutHistoryListPageViewModel({
	page,
	data,
	filters,
	translate,
	language,
}) {
	const t = createViewModelTranslator(translate);
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
		statusLabel:
			item.status === "cancelled"
				? t("history.cancelled", { defaultValue: "Cancelled" })
				: t("history.finished", { defaultValue: "Finished" }),
		historyDate: {
			value: item.historyDate,
			label: formatDate(item.historyDate, language, t),
			context:
				item.status === "finished"
					? t("history.completed", { defaultValue: "Completed" })
					: t("history.planned", { defaultValue: "Scheduled" }),
		},
		scheduledDate:
			item.status === "finished" && item.scheduledDate
				? {
						value: item.scheduledDate,
						label: formatDate(item.scheduledDate, language, t),
					}
				: null,
		stepSummary: t("history.stepSummary", {
			performed: item.performedStepCount,
			skipped: item.skippedStepCount,
			total: item.stepCount,
			defaultValue: "{{performed}} completed · {{skipped}} skipped · {{total}} total",
		}),
		stepCounts: [
			{
				label: t("history.completed", { defaultValue: "Completed" }),
				value: item.performedStepCount,
			},
			{
				label: t("history.skipped", { defaultValue: "Skipped" }),
				value: item.skippedStepCount,
			},
			{ label: t("history.total", { defaultValue: "Total" }), value: item.stepCount },
		],
	}));

	return {
		page: {
			...page,
			title: `${t("history.title", { defaultValue: "Workout history" })} · Let's Flex!`,
		},
		shell: { currentUser: data.currentUser, activeNavigation: "history" },
		heading: {
			eyebrow: t("history.eyebrow", { defaultValue: "Training record" }),
			title: t("history.title", { defaultValue: "Workout history" }),
			description: t("history.description", {
				defaultValue: "Review finished and cancelled sessions from your programs.",
			}),
			meta: t("history.sessionsCount", {
				count: data.history.totalCount,
				defaultValue: "{{count}} sessions",
			}),
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
 * @param {{page: Record<string, unknown>, currentUser: import("../../../src/features/users/users.types.js").User | null, state: "not-found" | "failure", translate?: Function, language?: string}} input
 */
export function createWorkoutHistoryStatePageViewModel({
	page,
	currentUser,
	state,
	translate,
}) {
	const t = createViewModelTranslator(translate);
	const notFound = state === "not-found";
	return {
		page: {
			...page,
			title: `${t(notFound ? "history.workoutNotFound" : "history.unavailable", { defaultValue: notFound ? "Workout not found" : "History unavailable" })} · Let's Flex!`,
		},
		shell: { currentUser, activeNavigation: "history" },
		state: {
			kind: state,
			eyebrow: notFound
				? t("history.title", { defaultValue: "Workout history" })
				: t("history.temporaryProblem", { defaultValue: "Temporary problem" }),
			title: notFound
				? t("history.workoutNotFound", { defaultValue: "Workout not found" })
				: t("history.unavailableTitle", { defaultValue: "History is unavailable" }),
			message: notFound
				? t("history.notFoundMessage", {
						defaultValue:
							"This workout is unavailable. It may not exist or may not belong to this account.",
					})
				: t("history.failureMessage", {
						defaultValue:
							"We couldn't load workout history right now. Your workout data has not been changed.",
					}),
			actionLabel: notFound
				? t("history.backToHistory", { defaultValue: "Return to workout history" })
				: t("history.retry", { defaultValue: "Try workout history again" }),
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
function toStepViewModel(step, t, language) {
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
				? t("history.completed", { defaultValue: "Completed" })
				: step.status === "skipped"
					? t("history.skipped", { defaultValue: "Skipped" })
					: t("history.recorded", { defaultValue: "Recorded" }),
		planned: {
			sets: step.plannedSets,
			reps: step.plannedReps,
			loadValue: step.plannedLoadValue,
			loadUnit: step.plannedLoadUnit,
			loadLabel: formatLoadLabel(step.plannedLoadValue, step.plannedLoadUnit, language),
		},
		completedAt: {
			value: toIsoTimestamp(step.completedAt),
			label: formatTimestamp(step.completedAt, language, t),
		},
		notes: step.notes,
		sets: step.sets.map((set) => ({
			...set,
			loadLabel: formatLoadLabel(set.loadValue, set.loadUnit, language),
		})),
	};
}

/**
 * @param {{page: Record<string, unknown>, currentUser: import("../../../src/features/users/users.types.js").User | null, history: import("../../../src/features/workoutHistory/workoutHistory.types.js").WorkoutHistoryDetail, returnFilters: import("../../../src/features/workoutHistory/workoutHistory.types.js").WorkoutHistoryFilters, returnPage: number, translate?: Function, language?: string}} input
 */
export function createWorkoutHistoryDetailPageViewModel({
	page,
	currentUser,
	history,
	returnFilters,
	returnPage,
	translate,
	language,
}) {
	const t = createViewModelTranslator(translate);
	return {
		page: {
			...page,
			title: `${history.sessionName} · ${t("history.title", { defaultValue: "Workout history" })} · Let's Flex!`,
		},
		shell: { currentUser, activeNavigation: "history" },
		backHref: historyUrl(returnFilters, returnPage),
		heading: {
			eyebrow: t("history.title", { defaultValue: "Workout history" }),
			title: history.sessionName,
			description: history.programName ?? "Unnamed program",
			meta:
				history.status === "cancelled"
					? t("history.cancelled", { defaultValue: "Cancelled" })
					: t("history.finished", { defaultValue: "Finished" }),
		},
		summary: {
			status: history.status,
			statusLabel:
				history.status === "cancelled"
					? t("history.cancelled", { defaultValue: "Cancelled" })
					: t("history.finished", { defaultValue: "Finished" }),
			historyDate: {
				value: history.historyDate,
				label: formatDate(history.historyDate, language, t),
				context:
					history.status === "finished"
						? t("history.completed", { defaultValue: "Completed" })
						: t("history.planned", { defaultValue: "Scheduled" }),
			},
			scheduledDate:
				history.status === "finished" && history.scheduledDate
					? {
							value: history.scheduledDate,
							label: formatDate(history.scheduledDate, language, t),
						}
					: null,
			startedAt: {
				value: toIsoTimestamp(history.startedAt),
				label: formatTimestamp(history.startedAt, language, t),
			},
			finishedAt: {
				value: toIsoTimestamp(history.finishedAt),
				label: formatTimestamp(history.finishedAt, language, t),
			},
			notes: history.notes,
		},
		steps: history.steps.map((step) => toStepViewModel(step, t, language)),
		stepsCountLabel: translateCount(
			translate,
			"history.stepsCount",
			history.steps.length,
			{
				one: "{{count}} step",
				other: "{{count}} steps",
			},
		),
		emptySteps: {
			title:
				history.status === "cancelled"
					? t("history.noWorkoutResults", { defaultValue: "No workout results" })
					: t("history.noExercisesRecorded", { defaultValue: "No exercises recorded" }),
			message:
				history.status === "cancelled"
					? t("workout.emptyCancelledMessage", {
							defaultValue:
								"This session was cancelled before exercise results were recorded.",
						})
					: t("workout.finishedWithoutWorkoutSteps", {
							defaultValue: "This workout was finished without exercise steps.",
						}),
		},
	};
}
