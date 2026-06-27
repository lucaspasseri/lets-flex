import * as dayService from "../services/dayService.js";

async function show(req, res, next) {
	try {
		const { pageState, appState, data } = await dayService.getDayPage({
			query: req.query,
			sessionState: res.locals.sessionState,
		});

		const day = {
			page: { ...res.locals.page, title: "Let's Flex!" },
			pageState,
			appState,
			data,
		};

		res.render("day", day);
	} catch (err) {
		next(err);
	}
}

export const dayController = {
	show,
};
