import asyncHandler from "../../../utils/asyncControllerHandler.js";
import { getDayPage } from "../../features/day/getDayPage.js";

async function show(req, res, next) {
	try {
		const { pageState, appState, data } = await getDayPage({
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
	show: asyncHandler(show),
};
