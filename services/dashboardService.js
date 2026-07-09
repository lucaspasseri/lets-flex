import { toSessionViewModel } from "../views/viewModels/toSessionViewModel.js";
import * as pageStateResolver from "./dashboardPageStateResolver.js";
import * as dataLoader from "./dashboardDataLoader.js";
import * as appStateResolver from "./dashboardAppStateResolver.js";

async function getDashboardPage({ query, sessionState }) {
	const { daysDifference, workoutSessionId } = query;

	const pageState = await pageStateResolver.getPageState({
		daysDifference,
		workoutSessionId,
	});

	const { userId, programId } = sessionState;

	const data = await dataLoader.getData({
		userId,
		programId,
		daysDifference: pageState.daysDifference,
	});

	const appState = await appStateResolver.getAppState({
		workoutSessionId: pageState.workoutSessionId,
		data,
	});

	return {
		pageState,
		appState: {
			...appState,
			day: data.day,
		},
		data: {
			cycles: {
				items: data.cycleArr,
			},
			workoutSessions: {
				items: data.workoutSessionArr,
				itemsByTrainingDay: data.workoutSessionArrByTrainingDay,
			},
			heatmap: {
				items: data.heatmapArr,
			},
		},
	};
}

export { getDashboardPage };
