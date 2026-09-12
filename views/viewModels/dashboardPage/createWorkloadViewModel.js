import createViewModelTranslator from "../translate.js";

/** @param {string} unit */
function formatUnit(unit) {
	if (unit === "Kilograms") return { short: "kg", long: "kilograms" };
	if (unit === "Pounds" || unit === "Libra") {
		return { short: "lb", long: "pounds" };
	}
	return { short: unit, long: unit };
}

/** @param {import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData} input @param {Function} [translate] */
export default function createWorkloadViewModel(
	{ currentProgram, analytics },
	translate,
	language = "en",
) {
	const t = createViewModelTranslator(translate);
	const numberFormatter = new Intl.NumberFormat(language, {
		maximumFractionDigits: 2,
	});
	const work = analytics.performedWork;
	const isEmpty = work.performedStepCount === 0 && work.recordedSetCount === 0;
	const repetitionCoverage =
		work.recordedSetCount === 0
			? t("dashboard.noRecordedSets", { defaultValue: "No recorded sets yet." })
			: work.setsWithRepetitionsCount === work.recordedSetCount
				? t("dashboard.everySetReps", {
						defaultValue: "Every recorded set includes repetitions.",
					})
				: t("dashboard.someSetReps", {
						included: numberFormatter.format(work.setsWithRepetitionsCount),
						total: numberFormatter.format(work.recordedSetCount),
						defaultValue: "{{included}} of {{total}} sets include repetitions.",
					});

	return {
		isVisible: Boolean(currentProgram),
		isEmpty,
		headingId: "workload-heading",
		eyebrow: t("dashboard.workPerformed", { defaultValue: "Work performed" }),
		title: t("dashboard.recordedWorkload", { defaultValue: "Recorded workload" }),
		description: t("dashboard.workloadDescription", {
			defaultValue:
				"Completed steps and sets are counted directly from your workout log. Load volume is never combined across units.",
		}),
		emptyState: {
			title: t("dashboard.noWorkload", { defaultValue: "No workload recorded yet" }),
			message: t("dashboard.workloadMessage", {
				defaultValue:
					"Complete an exercise with at least one set to build your workload summary.",
			}),
		},
		metrics: [
			{
				label: t("dashboard.performedSteps", { defaultValue: "Performed steps" }),
				value: numberFormatter.format(work.performedStepCount),
			},
			{
				label: t("dashboard.recordedSets", { defaultValue: "Recorded sets" }),
				value: numberFormatter.format(work.recordedSetCount),
			},
			{
				label: t("dashboard.completedReps", { defaultValue: "Completed reps" }),
				value: numberFormatter.format(work.completedRepetitionCount),
			},
		],
		repetitionCoverage,
		volume: {
			isEmpty: analytics.loadVolume.length === 0,
			emptyMessage: t("dashboard.volumeDataMessage", {
				defaultValue: "Record both repetitions and load to calculate unit-safe volume.",
			}),
			items: analytics.loadVolume.map((bucket) => {
				const unit = formatUnit(bucket.unit);
				return {
					unit: bucket.unit,
					label: unit.short,
					value: numberFormatter.format(bucket.volume),
					accessibleValue: `${numberFormatter.format(bucket.volume)} ${unit.long}`,
					context: t("dashboard.volumeUnitContext", {
						count: numberFormatter.format(bucket.setCount),
						defaultValue: "{{count}} sets with complete load data",
					}),
				};
			}),
		},
	};
}
