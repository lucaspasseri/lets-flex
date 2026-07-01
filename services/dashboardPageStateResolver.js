import toNullableNumber from "../utils/toNullableNumber.js";

async function getPageState({ daysDifference, workoutSessionId }) {
	return {
		daysDifference: toNullableNumber(daysDifference),
		workoutSessionId: toNullableNumber(workoutSessionId),
	};
}

export { getPageState };
