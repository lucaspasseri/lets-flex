/**
 * @typedef {import("./trainingDays.types.js").ProgramTrainingDayRow} ProgramTrainingDayRow
 * @typedef {import("./trainingDays.types.js").TrainingDay} TrainingDay
 */

/**
 * @param {ProgramTrainingDayRow} row
 * @returns {TrainingDay}
 */
export function toTrainingDay(row) {
	return {
		id: row.training_day_id,
		cycleId: row.cycle_id,
		programId: row.program_id,
		cycleOrder: row.cycle_order,
		dayOrder: row.day_order,
		scheduledDate: row.scheduled_date,
		label: row.label,
	};
}
