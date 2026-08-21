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

export {};
