/**
 * A finished-workout count attributed to its UTC completion date.
 *
 * @typedef {object} ActivityBucket
 * @property {string} dateKey ISO calendar date (`YYYY-MM-DD`).
 * @property {number} finishedCount
 */

/**
 * Workout adherence for one seven-day program-relative bucket.
 *
 * @typedef {object} AdherenceBucket
 * @property {number} weekIndex Zero-based week offset from the program start date.
 * @property {string} weekStartDate ISO calendar date (`YYYY-MM-DD`).
 * @property {string} weekEndDate ISO calendar date (`YYYY-MM-DD`). The last week is capped at the program boundary.
 * @property {number} scheduledCount
 * @property {number} finishedCount
 * @property {number} cancelledCount
 * @property {number} plannedCount
 * @property {number} inProgressCount
 * @property {number | null} completionRate Finished sessions divided by all scheduled sessions.
 */

/**
 * Totals derived only from performed step logs and their persisted set rows.
 *
 * @typedef {object} PerformedWorkSummary
 * @property {number} performedStepCount
 * @property {number} recordedSetCount
 * @property {number} completedRepetitionCount Null repetitions are excluded from this sum.
 * @property {number} setsWithRepetitionsCount
 */

/**
 * Load volume derived from sets where repetitions, load, and unit are all present.
 * Units remain separate and are never converted or combined.
 *
 * @typedef {object} LoadVolumeBucket
 * @property {string} unit
 * @property {number} volume
 * @property {number} setCount
 */

/**
 * @typedef {object} ProgramAnalytics
 * @property {ActivityBucket[]} activity
 * @property {AdherenceBucket[]} adherence
 * @property {PerformedWorkSummary} performedWork
 * @property {LoadVolumeBucket[]} loadVolume
 */

/**
 * JSON aggregates returned by PostgreSQL. Values are normalized at the application
 * boundary because PostgreSQL numeric and bigint values may be represented as strings.
 *
 * @typedef {object} ProgramAnalyticsRow
 * @property {unknown} activity
 * @property {unknown} adherence
 * @property {unknown} performed_work
 * @property {unknown} load_volume
 */

export {};
