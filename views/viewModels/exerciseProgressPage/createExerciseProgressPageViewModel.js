import createViewModelTranslator from "../translate.js";

/** @param {string} dateKey */
function formatDate(
	dateKey,
	language = "en",
	t = (key, options) => options?.defaultValue ?? key,
) {
	const date = new Date(`${dateKey}T00:00:00.000Z`);
	return Number.isNaN(date.valueOf())
		? t("progress.dateUnavailable", { defaultValue: "Date unavailable" })
		: new Intl.DateTimeFormat(language, {
				dateStyle: "medium",
				timeZone: "UTC",
			}).format(date);
}

/** @param {string | Date | null} value */
function formatTimestamp(
	value,
	language = "en",
	t = (key, options) => options?.defaultValue ?? key,
) {
	if (!value)
		return t("progress.timeUnavailable", { defaultValue: "Time unavailable" });
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.valueOf())
		? t("progress.timeUnavailable", { defaultValue: "Time unavailable" })
		: `${new Intl.DateTimeFormat(language, {
				timeStyle: "short",
				timeZone: "UTC",
			}).format(date)} UTC`;
}

/** @param {{exerciseName: string, exerciseVariantName: string | null}} choice */
function choiceLabel(choice) {
	return choice.exerciseVariantName
		? `${choice.exerciseName} — ${choice.exerciseVariantName}`
		: choice.exerciseName;
}

/** @param {number | null} value @param {string} unit */
function loadLabel(value, unit, numberFormatter, t) {
	return value === null
		? t("progress.notRecorded", { defaultValue: "Not recorded" })
		: `${numberFormatter.format(value)} ${unit}`;
}

/** @param {number | null} value @param {string} unit */
function volumeLabel(value, unit, numberFormatter, t) {
	return value === null
		? t("progress.notRecorded", { defaultValue: "Not recorded" })
		: t("progress.repetitionsByUnit", {
				value: numberFormatter.format(value),
				unit,
				defaultValue: "{{value}} repetitions × {{unit}}",
			});
}

/**
 * @param {import("../../../src/features/exerciseProgress/exerciseProgressPage.types.js").ExerciseProgressPageQuery} query
 */
function clearDatesUrl(query) {
	if (!query.programId || !query.exerciseKey) return null;
	const parameters = new URLSearchParams({
		programId: String(query.programId),
		exerciseKey: query.exerciseKey,
	});
	if (query.pointLimit !== 100) {
		parameters.set("pointLimit", String(query.pointLimit));
	}
	return `/progress?${parameters.toString()}`;
}

/**
 * @param {import("../../../src/features/exerciseProgress/exerciseProgress.types.js").ExerciseProgress} progress
 */
function toResults(progress, t, language) {
	const summary = progress.summary;
	const numberFormatter = new Intl.NumberFormat(language, { maximumFractionDigits: 2 });
	const count = (value, key, fallback) =>
		t(key, { count: value, defaultValue: fallback });
	return {
		isVisible: summary.occurrenceCount > 0,
		selection: {
			title: choiceLabel(progress.selection),
			exerciseName: progress.selection.exerciseName,
			exerciseVariantName: progress.selection.exerciseVariantName,
			availableContext: t("progress.availableContext", {
				count: count(
					progress.selection.occurrenceCount,
					"progress.workoutCount",
					"{{count}} workouts",
				),
				from: formatDate(progress.selection.firstDate ?? "", language, t),
				to: formatDate(progress.selection.lastDate ?? "", language, t),
				defaultValue: "{{count}} available from {{from}} to {{to}}.",
			}),
		},
		metrics: [
			{
				label: t("progress.workoutOccurrences", {
					defaultValue: "Workout occurrences",
				}),
				value: numberFormatter.format(summary.occurrenceCount),
			},
			{
				label: t("progress.performedSteps", { defaultValue: "Performed steps" }),
				value: numberFormatter.format(summary.performedStepCount),
			},
			{
				label: t("progress.recordedSets", { defaultValue: "Recorded sets" }),
				value: numberFormatter.format(summary.recordedSetCount),
			},
			{
				label: t("progress.completedRepetitions", {
					defaultValue: "Completed repetitions",
				}),
				value: numberFormatter.format(summary.completedRepetitionCount),
			},
		],
		coverage: [
			t("progress.validRepetitionsCoverage", {
				valid: summary.setsWithRepetitionsCount,
				total: summary.recordedSetCount,
				defaultValue: "{{valid}} of {{total}} recorded sets have valid repetitions.",
			}),
			t("progress.validLoadCoverage", {
				valid: summary.setsWithLoadCount,
				total: summary.recordedSetCount,
				defaultValue:
					"{{valid}} of {{total}} recorded sets have a valid load and unit.",
			}),
			t("progress.volumeCoverage", {
				valid: summary.setsWithVolumeCount,
				total: summary.recordedSetCount,
				defaultValue: "{{valid}} of {{total}} recorded sets contribute to load volume.",
			}),
		],
		units: summary.units.map((unit) => ({
			unit: unit.unit,
			maximumLoad: loadLabel(unit.maximumLoad, unit.unit, numberFormatter, t),
			volume: volumeLabel(unit.volume, unit.unit, numberFormatter, t),
			loadContext: count(
				unit.loadObservationCount,
				"progress.loadObservation",
				"{{count}} load observations",
			),
			volumeContext: count(
				unit.volumeSetCount,
				"progress.volumeSet",
				"{{count}} volume sets",
			),
		})),
		occurrences: progress.occurrences.map((occurrence) => ({
			workoutSessionId: occurrence.workoutSessionId,
			historyHref: `/history/${occurrence.workoutSessionId}`,
			date: {
				value: occurrence.dateKey,
				label: formatDate(occurrence.dateKey, language, t),
			},
			finishedAt: formatTimestamp(occurrence.finishedAt, language, t),
			sessionName: occurrence.sessionName,
			performedStepCount: occurrence.performedStepCount,
			recordedSetCount: occurrence.recordedSetCount,
			completedRepetitionCount: occurrence.completedRepetitionCount,
			units: occurrence.units.map((unit) => ({
				unit: unit.unit,
				maximumLoad: loadLabel(unit.maximumLoad, unit.unit, numberFormatter, t),
				volume: volumeLabel(unit.volume, unit.unit, numberFormatter, t),
				context: `${count(unit.loadObservationCount, "progress.loadObservation", "{{count}} load observations")}; ${count(unit.volumeSetCount, "progress.volumeSet", "{{count}} volume sets")}`,
			})),
			emptyUnitMessage:
				occurrence.units.length === 0
					? t("progress.noValidLoadRecorded", {
							defaultValue: "No valid load data recorded.",
						})
					: null,
		})),
		truncationMessage: progress.isTruncated
			? t("progress.showingRecentWorkouts", {
					shown: progress.returnedOccurrenceCount,
					total: progress.totalOccurrenceCount,
					defaultValue:
						"Showing the most recent {{shown}} of {{total}} workouts in this range.",
				})
			: null,
	};
}

/**
 * @param {object} input
 * @param {Record<string, unknown>} input.page
 * @param {import("../../../src/features/exerciseProgress/exerciseProgressPage.types.js").ExerciseProgressPageData} input.data
 * @param {import("../../../src/features/exerciseProgress/exerciseProgressPage.types.js").ExerciseProgressPageQuery} input.query
 * @param {Function} [input.translate]
 * @param {string} [input.language]
 * @returns {import("./exerciseProgressPage.types.js").ExerciseProgressPageViewModel}
 */
export function createExerciseProgressPageViewModel({
	page,
	data,
	query,
	translate,
	language = "en",
}) {
	const t = createViewModelTranslator(translate);
	if (!data.currentUser) {
		throw new Error("Exercise progress requires an authenticated user.");
	}
	const programOptions = data.programs
		.map((program) => ({
			value: program.id,
			label: program.name || "Unnamed program",
		}))
		.sort((left, right) => left.label.localeCompare(right.label));
	const selectedProgram =
		data.programs.find((program) => program.id === query.programId) ?? null;
	if (
		query.programId &&
		!programOptions.some((option) => option.value === query.programId)
	) {
		programOptions.push({ value: query.programId, label: "Unavailable program" });
	}

	const exerciseOptions = data.choices.map((choice) => ({
		value: choice.key,
		label: choiceLabel(choice),
	}));
	const selectedChoice =
		data.choices.find((choice) => choice.key === query.exerciseKey) ?? null;
	if (
		query.exerciseKey &&
		selectedProgram &&
		!exerciseOptions.some((option) => option.value === query.exerciseKey)
	) {
		exerciseOptions.push({
			value: query.exerciseKey,
			label: "Unavailable exercise",
		});
	}

	const progress = selectedChoice ? data.progress : null;
	const results = progress
		? toResults(progress, t, language)
		: {
				isVisible: false,
				selection: {
					title: "",
					exerciseName: "",
					exerciseVariantName: null,
					availableContext: "",
				},
				metrics: [],
				coverage: [],
				units: [],
				occurrences: [],
				truncationMessage: null,
			};

	/** @type {import("./exerciseProgressPage.types.js").ExerciseProgressPageState | null} */
	let state = null;
	if (data.programs.length === 0) {
		state = {
			kind: "no-programs",
			title: t("progress.createProgramFirst", {
				defaultValue: "Create a program first",
			}),
			message: t("progress.programRequiredMessage", {
				defaultValue:
					"Exercise progress appears after a program has finished workout data.",
			}),
			action: {
				label: t("progress.goToPrograms", { defaultValue: "Go to programs" }),
				href: "/programs",
			},
		};
	} else if (!query.programId) {
		state = {
			kind: "choose-program",
			title: t("progress.chooseProgram", { defaultValue: "Choose a program" }),
			message: t("progress.chooseProgramMessage", {
				defaultValue: "Select a program to load exercises from its finished workouts.",
			}),
			action: null,
		};
	} else if (!selectedProgram) {
		state = {
			kind: "unavailable-program",
			title: t("progress.selectionUnavailable", {
				defaultValue: "Selection unavailable",
			}),
			message: t("progress.selectionUnavailableMessage", {
				defaultValue:
					"Choose one of your available programs to review exercise progress.",
			}),
			action: {
				label: t("progress.clearSelection", { defaultValue: "Clear selection" }),
				href: "/progress",
			},
		};
	} else if (data.choices.length === 0) {
		state = {
			kind: "no-exercises",
			title: t("progress.noExerciseProgress", {
				defaultValue: "No exercise progress yet",
			}),
			message: t("progress.noExerciseProgressMessage", {
				defaultValue:
					"Finish a workout with a performed exercise to create progress data for this program.",
			}),
			action: {
				label: t("progress.viewDashboard", { defaultValue: "View dashboard" }),
				href: "/",
			},
		};
	} else if (!query.exerciseKey) {
		state = {
			kind: "choose-exercise",
			title: t("progress.chooseExercise", { defaultValue: "Choose an exercise" }),
			message: t("progress.chooseExerciseMessage", {
				defaultValue: "Select an exercise to review its recorded workout trend.",
			}),
			action: null,
		};
	} else if (!selectedChoice || !data.progress) {
		state = {
			kind: "unavailable-exercise",
			title: t("progress.exerciseUnavailable", {
				defaultValue: "Exercise unavailable",
			}),
			message: t("progress.exerciseUnavailableMessage", {
				defaultValue:
					"Choose an exercise available in this program's finished workout history.",
			}),
			action: {
				label: t("progress.clearExercise", { defaultValue: "Clear exercise" }),
				href: `/progress?programId=${selectedProgram.id}`,
			},
		};
	} else if (data.progress.summary.occurrenceCount === 0) {
		state = {
			kind: "no-results",
			title: t("progress.noResults", { defaultValue: "No results in this date range" }),
			message: t("progress.noResultsMessage", {
				defaultValue: "Change or clear the dates to include other finished workouts.",
			}),
			action: {
				label: t("progress.clearDates", { defaultValue: "Clear dates" }),
				href: clearDatesUrl(query) ?? `/progress?programId=${selectedProgram.id}`,
			},
		};
	}

	return {
		page: {
			...page,
			title: `${t("progress.title", { defaultValue: "Exercise progress" })} · Let's Flex!`,
		},
		shell: { currentUser: data.currentUser, activeNavigation: "progress" },
		heading: {
			eyebrow: t("progress.eyebrow", { defaultValue: "Training insight" }),
			title: t("progress.title", { defaultValue: "Exercise progress" }),
			description: t("progress.description", {
				defaultValue:
					"Review recorded sets, repetitions, load, and unit-safe volume from finished workouts.",
			}),
			meta: selectedChoice ? choiceLabel(selectedChoice) : null,
		},
		programFilter: {
			action: "/progress",
			value: query.programId,
			options: programOptions,
		},
		analysisFilter: {
			isVisible: Boolean(selectedProgram && data.choices.length > 0),
			action: "/progress",
			programId: selectedProgram?.id ?? null,
			exerciseKey: query.exerciseKey,
			exerciseOptions,
			fromDate: query.fromDate,
			toDate: query.toDate,
			pointLimit: query.pointLimit,
			pointLimitOptions: [25, 50, 100, 200].map((value) => ({
				value,
				label: t("progress.workoutLimit", {
					count: value,
					defaultValue: "{{count}} workouts",
				}),
			})),
			hasDateFilters: Boolean(query.fromDate || query.toDate),
			clearDatesHref: clearDatesUrl(query),
		},
		results,
		state,
	};
}

/**
 * @param {{page: Record<string, unknown>, currentUser: import("../../../src/features/users/users.types.js").User | null, state: "not-found" | "failure", translate?: Function}} input
 * @returns {import("./exerciseProgressPage.types.js").ExerciseProgressStatePageViewModel}
 */
export function createExerciseProgressStatePageViewModel({
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
			title: `${t(notFound ? "progress.unavailable" : "progress.failed", { defaultValue: notFound ? "Progress unavailable" : "Progress failed" })} · Let's Flex!`,
		},
		shell: { currentUser, activeNavigation: "progress" },
		state: {
			kind: state,
			eyebrow: notFound
				? t("progress.title", { defaultValue: "Exercise progress" })
				: t("progress.temporaryProblem", { defaultValue: "Temporary problem" }),
			title: notFound
				? t("progress.unavailableTitle", { defaultValue: "Progress is unavailable" })
				: t("progress.failedTitle", { defaultValue: "Progress could not be loaded" }),
			message: notFound
				? t("progress.unavailableMessage", {
						defaultValue: "This progress page is unavailable for the current account.",
					})
				: t("progress.failureMessage", {
						defaultValue:
							"We couldn't load exercise progress right now. Your workout data has not been changed.",
					}),
			actionLabel: notFound
				? t("progress.returnDashboard", { defaultValue: "Return to dashboard" })
				: t("progress.retry", { defaultValue: "Try exercise progress again" }),
			actionHref: notFound ? "/" : "/progress",
		},
	};
}
