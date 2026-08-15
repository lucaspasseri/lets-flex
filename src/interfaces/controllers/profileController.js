import asyncHandler from "../../../utils/asyncControllerHandler.js";
import getProfilePageData from "../../features/profile/getProfilePageData.js";
import resolveActiveUserId from "../../features/profile/resolveActiveUserId.js";
import createProfilePageViewModel from "../../../views/viewModels/createProfilePageViewModel.js";

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("express").Response} Response
 */

/**
 * @param {Request} req
 * @param {Response} res
 */

async function show(req, res) {
	const userId = resolveActiveUserId({
		query: req?.query,
		sessionState: res.locals?.sessionState,
	});

	// @ts-ignore
	req.session.state = {
		// @ts-ignore
		...req.session.state,
		userId,
	};

	const page = { ...res.locals.page, title: "Let's Flex!" };
	const pageState = { userId };

	const { user, userArr } = await getProfilePageData({
		userId,
	});

	const profile = createProfilePageViewModel({
		page,
		pageState,
		user,
		userArr,
	});

	res.render("profile", profile);
}

export const profileController = {
	show: asyncHandler(show),
};
