/** @param {unknown} value */
function toRows(value) {
	return Array.isArray(value) ? value : [];
}

/** @param {unknown} value @returns {Record<string, unknown>} */
function toRecord(value) {
	return value && typeof value === "object"
		? /** @type {Record<string, unknown>} */ (value)
		: {};
}

/** @param {unknown} value */
function toCount(value) {
	const number = Number(value);
	return Number.isInteger(number) && number >= 0 ? number : 0;
}

/** @param {unknown} value */
function toNullableNumber(value) {
	if (value == null || value === "") return null;
	const number = Number(value);
	return Number.isFinite(number) && number >= 0 ? number : null;
}

/** @param {unknown} value */
function toNullableString(value) {
	return typeof value === "string" && value.length > 0 ? value : null;
}

/** @param {unknown} value */
function toDateKey(value) {
	if (typeof value === "string" && value.length > 0) return value.slice(0, 10);
	return value instanceof Date && !Number.isNaN(value.valueOf())
		? value.toISOString().slice(0, 10)
		: null;
}

/** @param {unknown} value */
function toDateValue(value) {
	return typeof value === "string" || value instanceof Date ? value : null;
}

/**
 * @param {string} exerciseName
 * @param {string | null} exerciseVariantName
 */
export function toExerciseProgressKey(exerciseName, exerciseVariantName) {
	return `snapshot.${Buffer.from(
		JSON.stringify([exerciseName, exerciseVariantName]),
	).toString("base64url")}`;
}

/**
 * Invalid and non-canonical keys fail before a database query. The encoded identity is not
 * an authorization token; every repository lookup still enforces program ownership.
 *
 * @param {string} key
 * @returns {import("./exerciseProgress.types.js").ExerciseProgressIdentity | null}
 */
export function fromExerciseProgressKey(key) {
	if (typeof key !== "string" || !key.startsWith("snapshot.") || key.length > 4096) {
		return null;
	}
	try {
		const value = JSON.parse(
			Buffer.from(key.slice("snapshot.".length), "base64url").toString("utf8"),
		);
		if (
			!Array.isArray(value) ||
			value.length !== 2 ||
			typeof value[0] !== "string" ||
			value[0].length === 0 ||
			!(value[1] === null || (typeof value[1] === "string" && value[1].length > 0))
		) {
			return null;
		}
		const identity = {
			exerciseName: value[0],
			exerciseVariantName: value[1],
		};
		return toExerciseProgressKey(
			identity.exerciseName,
			identity.exerciseVariantName,
		) === key
			? identity
			: null;
	} catch {
		return null;
	}
}

/** @param {unknown} value @returns {import("./exerciseProgress.types.js").ExerciseProgressUnitSummary | null} */
function toUnit(value) {
	const row = toRecord(value);
	const unit = toNullableString(row.unit);
	if (!unit) return null;
	return {
		unit,
		loadObservationCount: toCount(row.loadObservationCount),
		maximumLoad: toNullableNumber(row.maximumLoad),
		volumeSetCount: toCount(row.volumeSetCount),
		volume: toNullableNumber(row.volume),
	};
}

/** @param {unknown} value */
function toUnits(value) {
	return toRows(value)
		.map(toUnit)
		.filter(
			/** @returns {unit is import("./exerciseProgress.types.js").ExerciseProgressUnitSummary} */
			(unit) => unit !== null,
		);
}

/**
 * @param {import("./exerciseProgress.types.js").ExerciseProgressChoiceRow} row
 * @returns {import("./exerciseProgress.types.js").ExerciseProgressChoice | null}
 */
export function toExerciseProgressChoice(row) {
	const exerciseName = toNullableString(row.exercise_name);
	if (!exerciseName) return null;
	const exerciseVariantName = toNullableString(row.exercise_variant_name);
	return {
		key: toExerciseProgressKey(exerciseName, exerciseVariantName),
		exerciseName,
		exerciseVariantName,
		occurrenceCount: toCount(row.occurrence_count),
		firstDate: toDateKey(row.first_date),
		lastDate: toDateKey(row.last_date),
	};
}

/**
 * @param {unknown} value
 * @returns {import("./exerciseProgress.types.js").ExerciseProgressOccurrence | null}
 */
function toOccurrence(value) {
	const row = toRecord(value);
	const workoutSessionId = toCount(row.workoutSessionId);
	const dateKey = toDateKey(row.dateKey);
	if (workoutSessionId === 0 || !dateKey) return null;
	return {
		workoutSessionId,
		dateKey,
		finishedAt: toDateValue(row.finishedAt),
		sessionName: toNullableString(row.sessionName) ?? "Workout session",
		performedStepCount: toCount(row.performedStepCount),
		recordedSetCount: toCount(row.recordedSetCount),
		setsWithRepetitionsCount: toCount(row.setsWithRepetitionsCount),
		completedRepetitionCount: toCount(row.completedRepetitionCount),
		setsWithLoadCount: toCount(row.setsWithLoadCount),
		setsWithVolumeCount: toCount(row.setsWithVolumeCount),
		units: toUnits(row.units),
	};
}

/**
 * @param {import("./exerciseProgress.types.js").ExerciseProgressOccurrence[]} occurrences
 * @returns {import("./exerciseProgress.types.js").ExerciseProgressUnitSeries[]}
 */
function toSeries(occurrences) {
	/** @type {Map<string, import("./exerciseProgress.types.js").ExerciseProgressSeriesPoint[]>} */
	const byUnit = new Map();
	for (const occurrence of occurrences) {
		for (const unit of occurrence.units) {
			if (!byUnit.has(unit.unit)) byUnit.set(unit.unit, []);
			byUnit.get(unit.unit)?.push({
				workoutSessionId: occurrence.workoutSessionId,
				dateKey: occurrence.dateKey,
				finishedAt: occurrence.finishedAt,
				maximumLoad: unit.maximumLoad,
				volume: unit.volume,
				loadObservationCount: unit.loadObservationCount,
				volumeSetCount: unit.volumeSetCount,
			});
		}
	}
	return [...byUnit.entries()]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([unit, points]) => ({ unit, points }));
}

/**
 * @param {import("./exerciseProgress.types.js").ExerciseProgressRow} row
 * @param {object} context
 * @param {number} context.programId
 * @param {import("./exerciseProgress.types.js").ExerciseProgressFilters} context.filters
 * @param {number} context.pointLimit
 * @returns {import("./exerciseProgress.types.js").ExerciseProgress | null}
 */
export function toExerciseProgress(row, { programId, filters, pointLimit }) {
	const selection = toExerciseProgressChoice({
		exercise_name: row.exercise_name,
		exercise_variant_name: row.exercise_variant_name,
		occurrence_count: row.available_occurrence_count,
		first_date: row.available_first_date,
		last_date: row.available_last_date,
	});
	if (!selection) return null;
	const summaryRow = toRecord(row.summary);
	const occurrences = toRows(row.occurrences)
		.map(toOccurrence)
		.filter(
			/** @returns {occurrence is import("./exerciseProgress.types.js").ExerciseProgressOccurrence} */
			(occurrence) => occurrence !== null,
		);
	const totalOccurrenceCount = toCount(row.total_occurrence_count);
	return {
		programId,
		selection,
		filters,
		summary: {
			occurrenceCount: toCount(summaryRow.occurrenceCount),
			performedStepCount: toCount(summaryRow.performedStepCount),
			recordedSetCount: toCount(summaryRow.recordedSetCount),
			setsWithRepetitionsCount: toCount(summaryRow.setsWithRepetitionsCount),
			completedRepetitionCount: toCount(summaryRow.completedRepetitionCount),
			setsWithLoadCount: toCount(summaryRow.setsWithLoadCount),
			setsWithVolumeCount: toCount(summaryRow.setsWithVolumeCount),
			units: toUnits(summaryRow.units),
		},
		occurrences,
		series: toSeries(occurrences),
		totalOccurrenceCount,
		returnedOccurrenceCount: occurrences.length,
		isTruncated: totalOccurrenceCount > occurrences.length,
		pointLimit,
	};
}
