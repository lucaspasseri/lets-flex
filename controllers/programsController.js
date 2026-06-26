import * as programsService from "../services/programsService.js";

async function show(req, res, next) {
	try {
		const { pageState, appState, data } = await programsService.getProgramsPage(
			{
				query: req.query,
				sessionState: res.locals.sessionState,
			},
		);

		req.session.state = {
			...req.session.state,
			programId: appState?.program?.id ?? null,
			cycleId: appState?.cycle?.id ?? null,
		};

		const programs = {
			page: { ...res.locals.page, title: "Let's Flex!" },
			pageState,
			appState,
			data,
		};

		console.log({ programs });

		res.render("programs", programs);
	} catch (err) {
		next(err);
	}
}

export const programsController = {
	show,
};
