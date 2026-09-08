/**
 * An immutable exercise identity is the exact, trimmed exercise snapshot name plus the
 * exact, trimmed variant snapshot name when present. Renames intentionally create a new
 * identity; archived or deleted templates do not change an existing snapshot identity.
 *
 * @typedef {object} ExerciseProgressIdentity
 * @property {string} exerciseName
 * @property {string | null} exerciseVariantName
 */

/**
 * @typedef {object} ExerciseProgressChoice
 * @property {string} key Reversible, canonical base64url representation of the snapshot identity.
 * @property {string} exerciseName
 * @property {string | null} exerciseVariantName
 * @property {number} occurrenceCount Distinct finished workout sessions containing the identity.
 * @property {string | null} firstDate UTC completion date of the earliest occurrence.
 * @property {string | null} lastDate UTC completion date of the latest occurrence.
 */

/**
 * @typedef {object} ExerciseProgressFilters
 * @property {string | null} fromDate Inclusive UTC completion date (`YYYY-MM-DD`).
 * @property {string | null} toDate Inclusive UTC completion date (`YYYY-MM-DD`).
 */

/**
 * @typedef {object} ExerciseProgressInput
 * @property {number} userId
 * @property {number} programId
 * @property {string} exerciseKey
 * @property {ExerciseProgressFilters} filters
 * @property {number} [pointLimit] Maximum number of recent workout occurrences returned.
 */

/**
 * @typedef {object} ExerciseProgressUnitSummary
 * @property {string} unit
 * @property {number} loadObservationCount Sets with a finite non-negative load and non-empty unit.
 * @property {number | null} maximumLoad
 * @property {number} volumeSetCount Sets with valid repetitions, load, and unit.
 * @property {number | null} volume Sum of repetitions × load for complete sets.
 */

/**
 * One point represents all performed steps with the selected snapshot identity in one
 * finished workout. Multiple workouts completed on the same UTC date remain separate and
 * are ordered by completion timestamp and workout-session ID.
 *
 * @typedef {object} ExerciseProgressOccurrence
 * @property {number} workoutSessionId
 * @property {string} dateKey
 * @property {string | Date | null} finishedAt
 * @property {string} sessionName
 * @property {number} performedStepCount
 * @property {number} recordedSetCount
 * @property {number} setsWithRepetitionsCount
 * @property {number} completedRepetitionCount
 * @property {number} setsWithLoadCount
 * @property {number} setsWithVolumeCount
 * @property {ExerciseProgressUnitSummary[]} units
 */

/**
 * @typedef {object} ExerciseProgressSeriesPoint
 * @property {number} workoutSessionId
 * @property {string} dateKey
 * @property {string | Date | null} finishedAt
 * @property {number | null} maximumLoad
 * @property {number | null} volume
 * @property {number} loadObservationCount
 * @property {number} volumeSetCount
 */

/**
 * @typedef {object} ExerciseProgressUnitSeries
 * @property {string} unit
 * @property {ExerciseProgressSeriesPoint[]} points
 */

/**
 * @typedef {object} ExerciseProgressSummary
 * @property {number} occurrenceCount
 * @property {number} performedStepCount
 * @property {number} recordedSetCount
 * @property {number} setsWithRepetitionsCount
 * @property {number} completedRepetitionCount
 * @property {number} setsWithLoadCount
 * @property {number} setsWithVolumeCount
 * @property {ExerciseProgressUnitSummary[]} units
 */

/**
 * @typedef {object} ExerciseProgress
 * @property {number} programId
 * @property {ExerciseProgressChoice} selection
 * @property {ExerciseProgressFilters} filters
 * @property {ExerciseProgressSummary} summary Summary covers the complete filtered range.
 * @property {ExerciseProgressOccurrence[]} occurrences Recent occurrences, in chronological order.
 * @property {ExerciseProgressUnitSeries[]} series Unit-separated series derived from returned occurrences.
 * @property {number} totalOccurrenceCount
 * @property {number} returnedOccurrenceCount
 * @property {boolean} isTruncated
 * @property {number} pointLimit
 */

/**
 * @typedef {object} ExerciseProgressChoiceRow
 * @property {unknown} exercise_name
 * @property {unknown} exercise_variant_name
 * @property {unknown} occurrence_count
 * @property {unknown} first_date
 * @property {unknown} last_date
 */

/**
 * @typedef {object} ExerciseProgressRow
 * @property {unknown} exercise_name
 * @property {unknown} exercise_variant_name
 * @property {unknown} available_occurrence_count
 * @property {unknown} available_first_date
 * @property {unknown} available_last_date
 * @property {unknown} summary
 * @property {unknown} occurrences
 * @property {unknown} total_occurrence_count
 */

export {};
