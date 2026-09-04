const numberFormatter = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: 2,
});

/** @param {string} unit */
function formatUnit(unit) {
	if (unit === "Kilograms") return { short: "kg", long: "kilograms" };
	if (unit === "Pounds" || unit === "Libra") {
		return { short: "lb", long: "pounds" };
	}
	return { short: unit, long: unit };
}

/** @param {import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData} input */
export default function createWorkloadViewModel({ currentProgram, analytics }) {
	const work = analytics.performedWork;
	const isEmpty = work.performedStepCount === 0 && work.recordedSetCount === 0;
	const repetitionCoverage =
		work.recordedSetCount === 0
			? "No recorded sets yet."
			: work.setsWithRepetitionsCount === work.recordedSetCount
				? "Every recorded set includes repetitions."
				: `${numberFormatter.format(work.setsWithRepetitionsCount)} of ${numberFormatter.format(work.recordedSetCount)} sets include repetitions.`;

	return {
		isVisible: Boolean(currentProgram),
		isEmpty,
		headingId: "workload-heading",
		eyebrow: "Work performed",
		title: "Recorded workload",
		description:
			"Completed steps and sets are counted directly from your workout log. Load volume is never combined across units.",
		emptyState: {
			title: "No workload recorded yet",
			message:
				"Complete an exercise with at least one set to build your workload summary.",
		},
		metrics: [
			{
				label: "Performed steps",
				value: numberFormatter.format(work.performedStepCount),
			},
			{
				label: "Recorded sets",
				value: numberFormatter.format(work.recordedSetCount),
			},
			{
				label: "Completed reps",
				value: numberFormatter.format(work.completedRepetitionCount),
			},
		],
		repetitionCoverage,
		volume: {
			isEmpty: analytics.loadVolume.length === 0,
			emptyMessage: "Record both repetitions and load to calculate unit-safe volume.",
			items: analytics.loadVolume.map((bucket) => {
				const unit = formatUnit(bucket.unit);
				return {
					unit: bucket.unit,
					label: unit.short,
					value: numberFormatter.format(bucket.volume),
					accessibleValue: `${numberFormatter.format(bucket.volume)} ${unit.long}`,
					context: `${numberFormatter.format(bucket.setCount)} ${bucket.setCount === 1 ? "set" : "sets"} with complete load data`,
				};
			}),
		},
	};
}
