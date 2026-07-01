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

	const shapedWorkoutSession = appState.workoutSession
		? toSessionViewModel(appState.workoutSession, {
				type: "workout",
			})
		: null;

	return {
		pageState,
		appState: {
			...appState,
			day: data.day,
			workoutSession: shapedWorkoutSession,
		},
		data: {
			cycles: {
				items: data.cycleArr,
			},
			workoutSessions: {
				items: data.workoutSessionArr,
				itemsByTrainingDay: data.workoutSessionArrByTrainingDay,
			},
		},
	};
}

export { getDashboardPage };
