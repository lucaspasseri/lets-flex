import getDashboardPage from "../src/features/dashboard/getDashboardPage.js";
import asyncHandler from "../utils/asyncControllerHandler.js";

async function show(req, res) {
	const { pageState, appState, data } = await getDashboardPage({
		query: req.query,
		sessionState: res.locals.sessionState,
	});

	const dashboard = {
		page: {
			...res.locals.page,
			title: "Let's Flex!",
		},
		pageState,
		appState,
		data,
	};

	res.render("index", dashboard);
}

export const dashboardController = {
	show: asyncHandler(show),
};
