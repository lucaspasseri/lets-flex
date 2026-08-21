/**
 * @typedef {import("./cycles.types.js").CycleRow} CycleRow
 * @typedef {import("./cycles.types.js").CycleQueryRow} CycleQueryRow
 * @typedef {import("./cycles.types.js").Cycle} Cycle
 */

/**
 * @param {CycleRow | CycleQueryRow} row
 * @returns {Cycle}
 */
export function toCycle(row) {
	return {
		id: row.id,
		programId: row.program_id,
		name: row.name,
		size: row.cycle_size,
		order: row.cycle_order,
	};
}
