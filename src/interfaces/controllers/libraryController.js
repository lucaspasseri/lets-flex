import { getLibraryPage } from "../../features/library/getLibraryPage.js";

async function show(req, res, next) {
	try {
		const { pageState, appState, data } = await getLibraryPage({
			query: req.query,
			sessionState: res.locals.sessionState,
		});

		const library = {
			page: { ...res.locals.page, title: "Let's Flex!" },
			pageState,
			appState,
			data,
		};

		res.render("library", library);
	} catch (err) {
		next(err);
	}
}

export const libraryController = {
	show,
};
