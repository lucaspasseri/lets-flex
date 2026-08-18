/**
 * @typedef {import("../users/users.types.js").UserRow} UserRow
 * @typedef {import("../goals/goals.types.js").GoalRow} GoalRow
 */

/**
 * @typedef {object} ProgramRow
 * @property {number} id
 * @property {UserRow["id"]} user_id
 * @property {GoalRow["id"]} goal_id
 * @property {string} name
 * @property {string | Date} start_date
 */

/**
 * Application representation of a program.
 *
 * @typedef {object} Program
 * @property {number} id
 * @property {UserRow["id"]} userId
 * @property {GoalRow["id"] | null} goalId
 * @property {string} name
 * @property {string | Date} startDate
 */

export {};
