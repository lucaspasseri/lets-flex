import * as profileService from "../../../services/profileService.js";
import toNullableNumber from "../../../utils/toNullableNumber.js";

async function show(req, res, next) {
	try {
		const { pageState, appState, data } = await profileService.getProfilePage({
			query: req.query,
			sessionState: res.locals.sessionState,
		});

		const previousUserId = toNullableNumber(res?.locals?.sessionState?.userId);
		const currentUserId = toNullableNumber(appState.user?.id);

		if (currentUserId !== null && currentUserId !== previousUserId) {
			req.session.state = {
				userId: appState?.user?.id ?? null,
			};
		} else {
			req.session.state = {
				...req.session.state,
				userId: appState?.user?.id ?? null,
			};
		}

		const profile = {
			page: { ...res.locals.page, title: "Let's Flex!" },
			pageState,
			appState,
			data,
		};

		res.render("profile", profile);
	} catch (err) {
		next(err);
	}
}

export const profileController = {
	show,
};
