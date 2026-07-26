import asyncHandler from "../../../utils/asyncControllerHandler.js";
import toNullableNumber from "../../../utils/toNullableNumber.js";
import getLibraryPageData from "../../features/library/getLibraryPageData.js";
import createLibraryPageViewModel from "../../features/library/createLibraryPageViewModel.js";

async function show(req, res) {
	const userId = toNullableNumber(res?.locals?.sessionState?.userId);
	const sessionId = toNullableNumber(req?.query?.sessionId);

	const data = await getLibraryPageData({ userId, sessionId });
	const page = { ...res.locals.page, title: "Let's Flex!" };
	const pageState = { userId, sessionId };

	const library = createLibraryPageViewModel({ page, pageState, data });

	res.render("library", library);
}

export const libraryController = {
	show: asyncHandler(show),
};
