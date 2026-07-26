import asyncHandler from "../../../utils/asyncControllerHandler.js";
import getProfilePageData from "../../features/profile/getProfilePageData.js";
import createProfilePageViewModel from "../../features/profile/createProfilePageViewModel.js";
import resolveActiveUserId from "../../features/profile/resolveActiveUserId.js";

async function show(req, res) {
	const userId = resolveActiveUserId({
		query: req?.query,
		sessionState: res.locals?.sessionState,
	});

	req.session.state = {
		...req.session.state,
		userId,
	};

	const page = { ...res.locals.page, title: "Let's Flex!" };

	const pageState = { userId };

	const data = await getProfilePageData({
		userId,
	});

	const profile = await createProfilePageViewModel({ page, pageState, data });

	res.render("profile", profile);
}

export const profileController = {
	show: asyncHandler(show),
};
