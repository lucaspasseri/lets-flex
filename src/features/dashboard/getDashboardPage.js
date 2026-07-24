import toNullableNumber from "../../../utils/toNullableNumber.js";
import getAppState from "./dashboardPageAppStateResolver.js";
import dataLoader from "./dashboardPageDataLoader.js";

async function getDashboardPage({ query, sessionState }) {
	const { userId, programId } = sessionState;

	const daysDifference = toNullableNumber(query.daysDifference);
	const workoutSessionId = toNullableNumber(query.workoutSessionId);

	const data = await dataLoader({
		userId,
		programId,
		daysDifference: daysDifference,
	});

	const appState = await getAppState({
		workoutSessionId: workoutSessionId,
		data,
	});

	return {
		pageState: { daysDifference, workoutSessionId },
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
			barChart: {
				weekArr: data.barChart.weekArr,
				scheduledCountArr: data.barChart.scheduledCountArr,
				finishedCountArr: data.barChart.finishedCountArr,
			},
		},
	};
}

export default getDashboardPage;
