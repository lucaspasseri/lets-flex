/** @param {unknown} value */
function toRows(value) {
	return Array.isArray(value) ? value : [];
}

/** @param {unknown} value */
function toNumber(value) {
	const number = Number(value);
	return Number.isFinite(number) ? number : 0;
}

/** @param {unknown} value */
function toNullableNumber(value) {
	if (value == null || value === "") return null;
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

/** @param {unknown} value */
function toNullableString(value) {
	return typeof value === "string" && value.length > 0 ? value : null;
}

/** @param {unknown} value */
function toDateValue(value) {
	return typeof value === "string" || value instanceof Date ? value : null;
}

/** @param {unknown} value */
function toDateKey(value) {
	if (typeof value === "string" && value.length > 0) return value.slice(0, 10);
	return value instanceof Date && !Number.isNaN(value.valueOf())
		? value.toISOString().slice(0, 10)
		: null;
}

/** @param {unknown} value @returns {import("./workoutHistory.types.js").WorkoutHistoryStatus} */
function toStatus(value) {
	return value === "cancelled" ? "cancelled" : "finished";
}

/** @param {unknown} value @returns {Record<string, unknown>} */
function toRecord(value) {
	return value && typeof value === "object"
		? /** @type {Record<string, unknown>} */ (value)
		: {};
}

/** @param {unknown} value @returns {import("./workoutHistory.types.js").WorkoutHistoryListItem} */
function toListItem(value) {
	const row = toRecord(value);
	return {
		id: toNumber(row.id),
		status: toStatus(row.status),
		historyDate: toDateKey(row.history_date),
		scheduledDate: toDateKey(row.scheduled_date),
		startedAt: toDateValue(row.started_at),
		finishedAt: toDateValue(row.finished_at),
		programId: toNumber(row.program_id),
		programName: toNullableString(row.program_name),
		sessionName: toNullableString(row.session_name) ?? "Workout session",
		stepCount: toNumber(row.step_count),
		performedStepCount: toNumber(row.performed_step_count),
		skippedStepCount: toNumber(row.skipped_step_count),
	};
}

/** @param {unknown} value @returns {import("./workoutHistory.types.js").WorkoutHistorySet} */
function toSet(value) {
	const row = toRecord(value);
	return {
		id: toNumber(row.id),
		order: toNumber(row.order),
		reps: toNullableNumber(row.reps),
		loadValue: toNullableNumber(row.loadValue),
		loadUnit: toNullableString(row.loadUnit),
	};
}

/** @param {unknown} value @returns {import("./workoutHistory.types.js").WorkoutHistoryStep} */
function toStep(value) {
	const row = toRecord(value);
	return {
		id: toNumber(row.id),
		order: toNumber(row.order),
		status: toNullableString(row.status) ?? "planned",
		name: toNullableString(row.name),
		stepTypeName: toNullableString(row.stepTypeName),
		exerciseName: toNullableString(row.exerciseName),
		exerciseVariantName: toNullableString(row.exerciseVariantName),
		plannedSets: toNullableNumber(row.plannedSets),
		plannedReps: toNullableNumber(row.plannedReps),
		plannedLoadValue: toNullableNumber(row.plannedLoadValue),
		plannedLoadUnit: toNullableString(row.plannedLoadUnit),
		startedAt: toDateValue(row.startedAt),
		completedAt: toDateValue(row.completedAt),
		notes: toNullableString(row.notes),
		sets: toRows(row.sets).map(toSet),
	};
}

/**
 * @param {import("./workoutHistory.types.js").WorkoutHistoryPageRow} row
 * @param {{page: number, pageSize: number}} pagination
 * @returns {import("./workoutHistory.types.js").WorkoutHistoryPage}
 */
export function toWorkoutHistoryPage(row, { page, pageSize }) {
	const totalCount = toNumber(row.total_count);
	return {
		items: toRows(row.items).map(toListItem),
		totalCount,
		page,
		pageSize,
		totalPages: totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize),
	};
}

/**
 * @param {import("./workoutHistory.types.js").WorkoutHistoryDetailRow} row
 * @returns {import("./workoutHistory.types.js").WorkoutHistoryDetail}
 */
export function toWorkoutHistoryDetail(row) {
	return {
		id: toNumber(row.id),
		status: toStatus(row.status),
		historyDate: toDateKey(row.history_date),
		scheduledDate: toDateKey(row.scheduled_date),
		startedAt: toDateValue(row.started_at),
		finishedAt: toDateValue(row.finished_at),
		programId: toNumber(row.program_id),
		programName: toNullableString(row.program_name),
		sessionName: toNullableString(row.session_name) ?? "Workout session",
		notes: toNullableString(row.notes),
		steps: toRows(row.steps).map(toStep),
	};
}
