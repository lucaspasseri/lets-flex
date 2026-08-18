/**
 * @typedef {import("./goals.types.js").GoalRow} GoalRow
 * @typedef {import("./goals.types.js").Goal} Goal
 */

/**
 * @param {GoalRow} row
 * @returns {Goal}
 */
export function toGoal(row) {
	return {
		id: row.id,
		name: row.name,
	};
}
