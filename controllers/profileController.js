import * as profileService from "../services/profileService.js";

async function show(req, res, next) {
	try {
		const { pageState, appState, data } = await profileService.getProfilePage({
			query: req.query,
			sessionState: res.locals.sessionState,
		});

		req.session.state = {
			...req.session.state,
			userId: appState?.user?.id ?? null,
		};

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
