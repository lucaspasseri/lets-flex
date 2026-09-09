/**
 * @typedef {import("../cycles/cycles.types.js").CycleRow} CycleRow
 */

/**
 * @typedef {object} TrainingDayRow
 * @property {number} id
 * @property {CycleRow["id"]} cycle_id
 * @property {number} day_order
 * @property {string | Date | null} scheduled_date
 * @property {string | null} label
 */

/**
 * Owner-scoped row containing the complete hierarchy for one training day.
 *
 * @typedef {object} OwnedTrainingDayContextRow
 * @property {number} id
 * @property {CycleRow["id"]} cycle_id
 * @property {number} day_order
 * @property {string | Date | null} scheduled_date
 * @property {string | null} label
 * @property {string} cycle_name
 * @property {number} cycle_size
 * @property {number} cycle_order
 * @property {CycleRow["program_id"]} program_id
 * @property {number} user_id
 * @property {number | null} goal_id
 * @property {string} program_name
 * @property {string | Date} program_start_date
 */

/**
 * Row returned by the Programs-page training-day query.
 *
 * @typedef {object} ProgramTrainingDayRow
 * @property {TrainingDayRow["id"]} id
 * @property {CycleRow["id"]} cycle_id
 * @property {CycleRow["program_id"]} program_id
 * @property {CycleRow["cycle_order"]} cycle_order
 * @property {number} day_order
 * @property {string | Date | null} scheduled_date
 * @property {string | null} label
 */

/**
 * Application representation of a training day.
 *
 * @typedef {object} TrainingDay
 * @property {TrainingDayRow["id"]} id
 * @property {CycleRow["id"]} cycleId
 * @property {CycleRow["program_id"]} programId
 * @property {CycleRow["cycle_order"]} cycleOrder
 * @property {number} dayOrder
 * @property {string | Date | null} scheduledDate
 * @property {string | null} label
 */

/**
 * @typedef {object} TrainingDayContext
 * @property {import("../programs/programs.types.js").Program} program
 * @property {import("../cycles/cycles.types.js").Cycle} cycle
 * @property {TrainingDay} day
 */

export {};
