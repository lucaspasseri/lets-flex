/** @typedef {"finished" | "cancelled"} WorkoutHistoryStatus */

/**
 * The history calendar date is the UTC completion date for finished workouts and the
 * scheduled program date for cancelled workouts.
 *
 * @typedef {object} WorkoutHistoryFilters
 * @property {number | null} programId
 * @property {string | null} fromDate Inclusive ISO calendar date (`YYYY-MM-DD`).
 * @property {string | null} toDate Inclusive ISO calendar date (`YYYY-MM-DD`).
 */

/**
 * @typedef {object} WorkoutHistoryPageInput
 * @property {number} userId
 * @property {WorkoutHistoryFilters} filters
 * @property {number} [page]
 * @property {number} [pageSize]
 */

/**
 * @typedef {object} WorkoutHistoryListItem
 * @property {number} id
 * @property {WorkoutHistoryStatus} status
 * @property {string | null} historyDate
 * @property {string | null} scheduledDate
 * @property {string | Date | null} startedAt
 * @property {string | Date | null} finishedAt
 * @property {number} programId
 * @property {string | null} programName
 * @property {string} sessionName
 * @property {number} stepCount
 * @property {number} performedStepCount
 * @property {number} skippedStepCount
 */

/**
 * @typedef {object} WorkoutHistoryPage
 * @property {WorkoutHistoryListItem[]} items
 * @property {number} totalCount
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalPages
 */

/**
 * @typedef {object} WorkoutHistorySet
 * @property {number} id
 * @property {number} order
 * @property {number | null} reps
 * @property {number | null} loadValue
 * @property {string | null} loadUnit
 */

/**
 * @typedef {object} WorkoutHistoryStep
 * @property {number} id
 * @property {number} order
 * @property {string} status
 * @property {string | null} name
 * @property {string | null} stepTypeName
 * @property {string | null} exerciseName
 * @property {string | null} exerciseVariantName
 * @property {number | null} plannedSets
 * @property {number | null} plannedReps
 * @property {number | null} plannedLoadValue
 * @property {string | null} plannedLoadUnit
 * @property {string | Date | null} startedAt
 * @property {string | Date | null} completedAt
 * @property {string | null} notes
 * @property {WorkoutHistorySet[]} sets
 */

/**
 * @typedef {object} WorkoutHistoryDetail
 * @property {number} id
 * @property {WorkoutHistoryStatus} status
 * @property {string | null} historyDate
 * @property {string | null} scheduledDate
 * @property {string | Date | null} startedAt
 * @property {string | Date | null} finishedAt
 * @property {number} programId
 * @property {string | null} programName
 * @property {string} sessionName
 * @property {string | null} notes
 * @property {WorkoutHistoryStep[]} steps
 */

/**
 * PostgreSQL JSON aggregate returned for a history page.
 *
 * @typedef {object} WorkoutHistoryPageRow
 * @property {unknown} total_count
 * @property {unknown} items
 */

/**
 * PostgreSQL row returned for one owned history detail.
 *
 * @typedef {object} WorkoutHistoryDetailRow
 * @property {unknown} id
 * @property {unknown} status
 * @property {unknown} history_date
 * @property {unknown} scheduled_date
 * @property {unknown} started_at
 * @property {unknown} finished_at
 * @property {unknown} program_id
 * @property {unknown} program_name
 * @property {unknown} session_name
 * @property {unknown} notes
 * @property {unknown} steps
 */

export {};
