import createDashboardStatusViewModel from "./createDashboardStatusViewModel.js";
import createProgramBannerViewModel from "./createProgramBannerViewModel.js";
import createDateNavigationViewModel from "./createDateNavigationViewModel.js";
import createWorkoutSessionViewModel from "./createWorkoutSessionViewModel.js";
import createHeatmapViewModel from "./createHeatmapViewModel.js";
import createBarChartViewModel from "./createBarChartViewModel.js";
import createAnalyticsSummaryViewModel from "./createAnalyticsSummaryViewModel.js";
import createWorkloadViewModel from "./createWorkloadViewModel.js";
import createViewModelTranslator from "../translate.js";

/** @param {{page: Record<string, *>, pageState: {userId: number | null, programId: number | null, daysDifference: number | null, workoutSessionId: number | null}, data: import("../../../src/features/dashboard/dashboardPage.types.js").DashboardPageData, workoutLogFormState?: any, actionFormState?: any, workoutFeedback?: {tone: "error" | "success", title: string, message: string} | null, translate?: Function, language?: string}} input */
export default function createDashboardPageViewModel({
	page,
	pageState,
	data,
	workoutLogFormState,
	actionFormState,
	workoutFeedback,
	translate,
	language,
}) {
	const t = createViewModelTranslator(translate);
	const components = {
		status: createDashboardStatusViewModel(data, language),
		programBanner: createProgramBannerViewModel(data),
		dateNavigation: createDateNavigationViewModel({
			...data,
			daysDifference: pageState.daysDifference,
			translate,
			language,
		}),
		currentWorkout: createWorkoutSessionViewModel({
			session: data.selectedWorkoutSession,
			sessions: data.currentDayWorkoutSessions,
			daysDifference: pageState.daysDifference,
			workoutLogFormState,
			actionFormState,
			workoutFeedback,
			translate,
		}),
		analyticsSummary: createAnalyticsSummaryViewModel(data, t, language),
		heatmap: createHeatmapViewModel(data, t, language),
		barChart: createBarChartViewModel(data, t, language),
		workload: createWorkloadViewModel(data, t, language),
	};

	const resolvedPageState = {
		...pageState,
		workoutSessionId: data.selectedWorkoutSession?.id ?? null,
	};

	return {
		page: {
			...page,
			title: `${t("dashboard.title", { defaultValue: "Dashboard" })} · Let's Flex!`,
		},
		pageState: resolvedPageState,
		shell: { currentUser: data.currentUser, activeNavigation: "dashboard" },
		components,
	};
}
