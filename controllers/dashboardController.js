import * as dashboardService from "../services/dashboardService.js";

async function show(req, res, next) {
	try {
		const { pageState, appState, data } =
			await dashboardService.getDashboardPage({
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
	} catch (err) {
		next(err);
	}
}

export const dashboardController = {
	show,
};
