import asyncHandler from "../../../utils/asyncControllerHandler.js";
import toNullableNumber from "../../../utils/toNullableNumber.js";
import getDashboardPageData from "../../features/dashboard/getDashboardPageData.js";
import createDashboardPageViewModel from "../../../views/viewModels/dashboardPage/createDashboardPageViewModel.js";

/** @param {import("express").Request} req @param {import("express").Response} res */
async function show(req, res) {
	await renderDashboard(req, res);
}

export async function renderDashboard(req, res, formState = {}) {
	const userId = toNullableNumber(res.locals.sessionState?.userId);
	const programId = toNullableNumber(res.locals.sessionState?.programId);
	const query = req.validatedQuery ?? {};
	const daysDifference =
		toNullableNumber(formState.daysDifference) ??
		toNullableNumber(query.daysDifference);
	const workoutSessionId =
		toNullableNumber(formState.workoutSessionId) ??
		toNullableNumber(query.workoutSessionId);
	const data = await getDashboardPageData({
		userId,
		programId,
		daysDifference,
		workoutSessionId,
	});
	const dashboard = createDashboardPageViewModel({
		page: {
			...res.locals.page,
			title: "Let's Flex!",
		},
		data,
		pageState: { userId, programId, daysDifference, workoutSessionId },
		...formState,
	});

	res.render("index", dashboard);
}

export const dashboardController = {
	show: asyncHandler(show),
};
