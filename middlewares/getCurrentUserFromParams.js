import * as usersDb from "../db/users/index.js";

const getCurrentUserFromParams = async (req, res, next) => {
	try {
		const userId =
			res.locals.profilePageParams.userId ??
			res.locals.sessionState.userId ??
			null;

		if (!res.locals.appState) {
			res.locals.appState = {};
		}

		res.locals.sessionState.userId = userId;

		if (!userId) {
			res.locals.appState.currentUser = null;
			return next();
		}

		const currentUser = await usersDb.getUserById(userId);

		res.locals.appState.currentUser = currentUser;

		next();
	} catch (err) {
		next(err);
	}
};

export { getCurrentUserFromParams };
