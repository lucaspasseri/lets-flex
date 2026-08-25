import asyncHandler from "../../../utils/asyncControllerHandler.js";
import toNullableNumber from "../../../utils/toNullableNumber.js";
import getLibraryPageData from "../../features/library/getLibraryPageData.js";
import createLibraryPageViewModel from "../../../views/viewModels/libraryPage/createLibraryPageViewModel.js";

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("express").Response} Response
 */

/**
 * @param {Request} req
 * @param {Response} res
 */

async function show(req, res) {
	await renderLibrary(req, res);
}

/**
 * @param {Request} req
 * @param {Response} res
 * @param {{exerciseTemplateFormState?: Record<string, any>, sessionTemplateFormState?: Record<string, any>}} [formState]
 */
export async function renderLibrary(req, res, formState = {}) {
	const userId = toNullableNumber(res?.locals?.sessionState?.userId);
	const sessionId = toNullableNumber(req?.query?.sessionId);

	const data = await getLibraryPageData({ userId, sessionId });
	const page = { ...res.locals.page, title: "Let's Flex!" };
	const pageState = { userId, sessionId };

	const library = createLibraryPageViewModel({
		page,
		pageState,
		data,
		...formState,
	});

	res.render("library", library);
}

export const libraryController = {
	show: asyncHandler(show),
};
