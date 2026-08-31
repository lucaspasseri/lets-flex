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
 * @param {{exerciseTemplateFormState?: Record<string, any>, sessionTemplateFormState?: Record<string, any>, managementMode?: boolean}} [formState]
 */
export async function renderLibrary(req, res, formState = {}) {
	// @ts-ignore -- application Passport principal.
	const userId = toNullableNumber(req.user?.id);
	const sessionId = toNullableNumber(req?.query?.sessionId);

	const data = await getLibraryPageData({ userId, sessionId });
	const page = { ...res.locals.page, title: "Let's Flex!" };
	const pageState = { userId, sessionId };

	const library = createLibraryPageViewModel({
		page,
		pageState,
		data,
		managementMode: Boolean(formState.managementMode),
		...formState,
	});

	res.render("library", library);
}

async function showAdmin(req, res) {
	await renderLibrary(req, res, { managementMode: true });
}

export const libraryController = {
	show: asyncHandler(show),
	showAdmin: asyncHandler(showAdmin),
};
