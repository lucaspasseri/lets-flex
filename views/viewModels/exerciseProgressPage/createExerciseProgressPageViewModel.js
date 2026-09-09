const numberFormatter = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: 2,
});

/** @param {string} dateKey */
function formatDate(dateKey) {
	const date = new Date(`${dateKey}T00:00:00.000Z`);
	return Number.isNaN(date.valueOf())
		? "Date unavailable"
		: new Intl.DateTimeFormat("en", {
				dateStyle: "medium",
				timeZone: "UTC",
			}).format(date);
}

/** @param {string | Date | null} value */
function formatTimestamp(value) {
	if (!value) return "Time unavailable";
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.valueOf())
		? "Time unavailable"
		: `${new Intl.DateTimeFormat("en", {
				timeStyle: "short",
				timeZone: "UTC",
			}).format(date)} UTC`;
}

/** @param {number} count @param {string} singular @param {string} [plural] */
function countLabel(count, singular, plural = `${singular}s`) {
	return `${numberFormatter.format(count)} ${count === 1 ? singular : plural}`;
}

/** @param {{exerciseName: string, exerciseVariantName: string | null}} choice */
function choiceLabel(choice) {
	return choice.exerciseVariantName
		? `${choice.exerciseName} — ${choice.exerciseVariantName}`
		: choice.exerciseName;
}

/** @param {number | null} value @param {string} unit */
function loadLabel(value, unit) {
	return value === null ? "Not recorded" : `${numberFormatter.format(value)} ${unit}`;
}

/** @param {number | null} value @param {string} unit */
function volumeLabel(value, unit) {
	return value === null
		? "Not recorded"
		: `${numberFormatter.format(value)} repetitions × ${unit}`;
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
function toResults(progress) {
	const summary = progress.summary;
	return {
		isVisible: summary.occurrenceCount > 0,
		selection: {
			title: choiceLabel(progress.selection),
			exerciseName: progress.selection.exerciseName,
			exerciseVariantName: progress.selection.exerciseVariantName,
			availableContext: `${countLabel(
				progress.selection.occurrenceCount,
				"workout",
			)} available from ${formatDate(progress.selection.firstDate ?? "")} to ${formatDate(
				progress.selection.lastDate ?? "",
			)}.`,
		},
		metrics: [
			{
				label: "Workout occurrences",
				value: numberFormatter.format(summary.occurrenceCount),
			},
			{
				label: "Performed steps",
				value: numberFormatter.format(summary.performedStepCount),
			},
			{
				label: "Recorded sets",
				value: numberFormatter.format(summary.recordedSetCount),
			},
			{
				label: "Completed repetitions",
				value: numberFormatter.format(summary.completedRepetitionCount),
			},
		],
		coverage: [
			`${summary.setsWithRepetitionsCount} of ${summary.recordedSetCount} recorded sets have valid repetitions.`,
			`${summary.setsWithLoadCount} of ${summary.recordedSetCount} recorded sets have a valid load and unit.`,
			`${summary.setsWithVolumeCount} of ${summary.recordedSetCount} recorded sets contribute to load volume.`,
		],
		units: summary.units.map((unit) => ({
			unit: unit.unit,
			maximumLoad: loadLabel(unit.maximumLoad, unit.unit),
			volume: volumeLabel(unit.volume, unit.unit),
			loadContext: countLabel(unit.loadObservationCount, "load observation"),
			volumeContext: countLabel(unit.volumeSetCount, "volume set"),
		})),
		occurrences: progress.occurrences.map((occurrence) => ({
			workoutSessionId: occurrence.workoutSessionId,
			historyHref: `/history/${occurrence.workoutSessionId}`,
			date: {
				value: occurrence.dateKey,
				label: formatDate(occurrence.dateKey),
			},
			finishedAt: formatTimestamp(occurrence.finishedAt),
			sessionName: occurrence.sessionName,
			performedStepCount: occurrence.performedStepCount,
			recordedSetCount: occurrence.recordedSetCount,
			completedRepetitionCount: occurrence.completedRepetitionCount,
			units: occurrence.units.map((unit) => ({
				unit: unit.unit,
				maximumLoad: loadLabel(unit.maximumLoad, unit.unit),
				volume: volumeLabel(unit.volume, unit.unit),
				context: `${countLabel(
					unit.loadObservationCount,
					"load observation",
				)}; ${countLabel(unit.volumeSetCount, "volume set")}`,
			})),
			emptyUnitMessage:
				occurrence.units.length === 0 ? "No valid load data recorded." : null,
		})),
		truncationMessage: progress.isTruncated
			? `Showing the most recent ${progress.returnedOccurrenceCount} of ${progress.totalOccurrenceCount} workouts in this range.`
			: null,
	};
}

/**
 * @param {object} input
 * @param {Record<string, unknown>} input.page
 * @param {import("../../../src/features/exerciseProgress/exerciseProgressPage.types.js").ExerciseProgressPageData} input.data
 * @param {import("../../../src/features/exerciseProgress/exerciseProgressPage.types.js").ExerciseProgressPageQuery} input.query
 * @returns {import("./exerciseProgressPage.types.js").ExerciseProgressPageViewModel}
 */
export function createExerciseProgressPageViewModel({ page, data, query }) {
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
		? toResults(progress)
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
			title: "Create a program first",
			message: "Exercise progress appears after a program has finished workout data.",
			action: { label: "Go to programs", href: "/programs" },
		};
	} else if (!query.programId) {
		state = {
			kind: "choose-program",
			title: "Choose a program",
			message: "Select a program to load exercises from its finished workouts.",
			action: null,
		};
	} else if (!selectedProgram) {
		state = {
			kind: "unavailable-program",
			title: "Selection unavailable",
			message: "Choose one of your available programs to review exercise progress.",
			action: { label: "Clear selection", href: "/progress" },
		};
	} else if (data.choices.length === 0) {
		state = {
			kind: "no-exercises",
			title: "No exercise progress yet",
			message:
				"Finish a workout with a performed exercise to create progress data for this program.",
			action: { label: "View dashboard", href: "/" },
		};
	} else if (!query.exerciseKey) {
		state = {
			kind: "choose-exercise",
			title: "Choose an exercise",
			message: "Select an exercise to review its recorded workout trend.",
			action: null,
		};
	} else if (!selectedChoice || !data.progress) {
		state = {
			kind: "unavailable-exercise",
			title: "Exercise unavailable",
			message:
				"Choose an exercise available in this program's finished workout history.",
			action: {
				label: "Clear exercise",
				href: `/progress?programId=${selectedProgram.id}`,
			},
		};
	} else if (data.progress.summary.occurrenceCount === 0) {
		state = {
			kind: "no-results",
			title: "No results in this date range",
			message: "Change or clear the dates to include other finished workouts.",
			action: {
				label: "Clear dates",
				href: clearDatesUrl(query) ?? `/progress?programId=${selectedProgram.id}`,
			},
		};
	}

	return {
		page: { ...page, title: "Exercise progress · Let's Flex!" },
		shell: { currentUser: data.currentUser, activeNavigation: "progress" },
		heading: {
			eyebrow: "Training insight",
			title: "Exercise progress",
			description:
				"Review recorded sets, repetitions, load, and unit-safe volume from finished workouts.",
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
				label: `${value} workouts`,
			})),
			hasDateFilters: Boolean(query.fromDate || query.toDate),
			clearDatesHref: clearDatesUrl(query),
		},
		results,
		state,
	};
}

/**
 * @param {{page: Record<string, unknown>, currentUser: import("../../../src/features/users/users.types.js").User | null, state: "not-found" | "failure"}} input
 * @returns {import("./exerciseProgressPage.types.js").ExerciseProgressStatePageViewModel}
 */
export function createExerciseProgressStatePageViewModel({ page, currentUser, state }) {
	const notFound = state === "not-found";
	return {
		page: {
			...page,
			title: `${notFound ? "Progress unavailable" : "Progress failed"} · Let's Flex!`,
		},
		shell: { currentUser, activeNavigation: "progress" },
		state: {
			kind: state,
			eyebrow: notFound ? "Exercise progress" : "Temporary problem",
			title: notFound ? "Progress is unavailable" : "Progress could not be loaded",
			message: notFound
				? "This progress page is unavailable for the current account."
				: "We couldn't load exercise progress right now. Your workout data has not been changed.",
			actionLabel: notFound ? "Return to dashboard" : "Try exercise progress again",
			actionHref: notFound ? "/" : "/progress",
		},
	};
}
