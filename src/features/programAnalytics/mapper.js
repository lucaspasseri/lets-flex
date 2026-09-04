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
function toString(value) {
	return typeof value === "string" ? value : "";
}

/** @returns {import("./programAnalytics.types.js").ProgramAnalytics} */
export function emptyProgramAnalytics() {
	return {
		activity: [],
		adherence: [],
		performedWork: {
			performedStepCount: 0,
			recordedSetCount: 0,
			completedRepetitionCount: 0,
			setsWithRepetitionsCount: 0,
		},
		loadVolume: [],
	};
}

/**
 * @param {import("./programAnalytics.types.js").ProgramAnalyticsRow} row
 * @returns {import("./programAnalytics.types.js").ProgramAnalytics}
 */
export function toProgramAnalytics(row) {
	const performedWork = /** @type {Record<string, unknown>} */ (
		row.performed_work && typeof row.performed_work === "object"
			? row.performed_work
			: {}
	);

	return {
		activity: toRows(row.activity)
			.map((bucket) => ({
				dateKey: toString(bucket?.dateKey),
				finishedCount: toNumber(bucket?.finishedCount),
			}))
			.filter((bucket) => bucket.dateKey)
			.sort((left, right) => left.dateKey.localeCompare(right.dateKey)),
		adherence: toRows(row.adherence)
			.map((bucket) => {
				const scheduledCount = toNumber(bucket?.scheduledCount);
				const finishedCount = toNumber(bucket?.finishedCount);
				return {
					weekIndex: toNumber(bucket?.weekIndex),
					weekStartDate: toString(bucket?.weekStartDate),
					weekEndDate: toString(bucket?.weekEndDate),
					scheduledCount,
					finishedCount,
					cancelledCount: toNumber(bucket?.cancelledCount),
					plannedCount: toNumber(bucket?.plannedCount),
					inProgressCount: toNumber(bucket?.inProgressCount),
					completionRate: scheduledCount === 0 ? null : finishedCount / scheduledCount,
				};
			})
			.filter((bucket) => bucket.weekStartDate && bucket.weekEndDate)
			.sort((left, right) => left.weekIndex - right.weekIndex),
		performedWork: {
			performedStepCount: toNumber(performedWork.performedStepCount),
			recordedSetCount: toNumber(performedWork.recordedSetCount),
			completedRepetitionCount: toNumber(performedWork.completedRepetitionCount),
			setsWithRepetitionsCount: toNumber(performedWork.setsWithRepetitionsCount),
		},
		loadVolume: toRows(row.load_volume)
			.map((bucket) => ({
				unit: toString(bucket?.unit),
				volume: toNumber(bucket?.volume),
				setCount: toNumber(bucket?.setCount),
			}))
			.filter((bucket) => bucket.unit)
			.sort((left, right) => left.unit.localeCompare(right.unit)),
	};
}
