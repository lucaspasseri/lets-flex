/**
 * @typedef {import("../programs/programs.types.js").ProgramRow} ProgramsRow
 */

/**
 * @typedef {object} CycleRow
 * @property {number} id
 * @property {ProgramsRow["id"]} program_id
 * @property {string} name
 * @property {number} cycle_size
 * @property {number} cycle_order
 */

/**
 * @typedef {object} CycleQueryRow
 * @property {number} id
 * @property {string} name
 * @property {number} cycle_size
 * @property {number} cycle_order
 * @property {ProgramsRow["id"]} program_id
 * @property {ProgramsRow["name"]} program_name
 * @property {ProgramsRow["start_date"]} program_start_date
 */

/**
 * Application representation of a cycle.
 *
 * @typedef {object} Cycle
 * @property {number} id
 * @property {ProgramsRow["id"]} programId
 * @property {string} name
 * @property {number} size
 * @property {number} order
 */

export {};
