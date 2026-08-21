/**
 * @typedef {import("./programs.types.js").ProgramRow} ProgramRow
 * @typedef {import("./programs.types.js").Program} Program
 */

/**
 * @param {ProgramRow} row
 * @returns {Program}
 */
export function toProgram(row) {
	return {
		id: row.id,
		userId: row.user_id,
		goalId: row.goal_id,
		name: row.name,
		startDate: row.start_date,
	};
}
