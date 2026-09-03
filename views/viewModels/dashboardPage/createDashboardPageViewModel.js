import createDashboardStatusViewModel from "./createDashboardStatusViewModel.js";
import createProgramBannerViewModel from "./createProgramBannerViewModel.js";
import createDateNavigationViewModel from "./createDateNavigationViewModel.js";
import createWorkoutSessionViewModel from "./createWorkoutSessionViewModel.js";
import createHeatmapViewModel from "./createHeatmapViewModel.js";
import createBarChartViewModel from "./createBarChartViewModel.js";

/** @param {{page: Record<string, *>, pageState: {userId: number | null, programId: number | null, daysDifference: number | null, workoutSessionId: number | null}, data: import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData, workoutLogFormState?: any, actionFormState?: any, workoutFeedback?: {tone: "error" | "success", title: string, message: string} | null}} input */
export default function createDashboardPageViewModel({
	page,
	pageState,
	data,
	workoutLogFormState,
	actionFormState,
	workoutFeedback,
}) {
	const components = {
		status: createDashboardStatusViewModel(data),
		programBanner: createProgramBannerViewModel(data),
		dateNavigation: createDateNavigationViewModel({
			...data,
			daysDifference: pageState.daysDifference,
		}),
		currentWorkout: createWorkoutSessionViewModel({
			session: data.selectedWorkoutSession,
			sessions: data.currentDayWorkoutSessions,
			daysDifference: pageState.daysDifference,
			workoutLogFormState,
			actionFormState,
			workoutFeedback,
		}),
		heatmap: createHeatmapViewModel(data),
		barChart: createBarChartViewModel(data),
	};

	const resolvedPageState = {
		...pageState,
		workoutSessionId: data.selectedWorkoutSession?.id ?? null,
	};

	return {
		page,
		pageState: resolvedPageState,
		shell: { currentUser: data.currentUser, activeNavigation: "dashboard" },
		components,
	};
}
