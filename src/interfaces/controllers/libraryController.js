import { getLibraryPage } from "../../features/library/getLibraryPage.js";
import asyncHandler from "../../../utils/asyncControllerHandler.js";

async function show(req, res) {
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
}

export const libraryController = {
	show: asyncHandler(show),
};
