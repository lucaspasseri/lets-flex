/** @param {Pick<import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData, "currentProgram" | "currentTrainingDay" | "currentCycle">} input */
export default function createProgramBannerViewModel({
	currentProgram,
	currentTrainingDay,
	currentCycle,
}) {
	return {
		isVisible: Boolean(currentProgram),
		isOutsideProgram: Boolean(currentProgram && !currentTrainingDay),
		programName: currentTrainingDay ? (currentProgram?.name ?? null) : null,
		cycleName: currentCycle?.name ?? null,
	};
}
