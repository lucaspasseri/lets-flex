/**
 * @typedef {import("./trainingDays.types.js").ProgramTrainingDayRow} ProgramTrainingDayRow
 * @typedef {import("./trainingDays.types.js").TrainingDay} TrainingDay
 * @typedef {import("./trainingDays.types.js").OwnedTrainingDayContextRow} OwnedTrainingDayContextRow
 * @typedef {import("./trainingDays.types.js").TrainingDayContext} TrainingDayContext
 */

/**
 * @param {ProgramTrainingDayRow} row
 * @returns {TrainingDay}
 */
export function toTrainingDay(row) {
	return {
		id: row.id,
		cycleId: row.cycle_id,
		programId: row.program_id,
		cycleOrder: row.cycle_order,
		dayOrder: row.day_order,
		scheduledDate: row.scheduled_date,
		label: row.label,
	};
}

/**
 * @param {OwnedTrainingDayContextRow} row
 * @returns {TrainingDayContext}
 */
export function toTrainingDayContext(row) {
	return {
		program: {
			id: row.program_id,
			userId: row.user_id,
			goalId: row.goal_id,
			name: row.program_name,
			startDate: row.program_start_date,
		},
		cycle: {
			id: row.cycle_id,
			programId: row.program_id,
			name: row.cycle_name,
			size: row.cycle_size,
			order: row.cycle_order,
		},
		day: toTrainingDay({
			...row,
			program_id: row.program_id,
			cycle_order: row.cycle_order,
		}),
	};
}
