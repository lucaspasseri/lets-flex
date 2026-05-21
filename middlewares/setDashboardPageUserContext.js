import * as usersDb from "../db/users/index.js";
import pool from "../db/pool.js";

const setDashboardPageUserContext = async (req, res, next) => {
	const { userId } = res.locals.sessionState;

	const currentUser = userId
		? await usersDb.getUserById(pool, { userId })
		: null;

	res.locals.appState = { ...res.locals.appState, currentUser };
	res.locals.sessionState = {
		...res.locals.sessionState,
		userId: currentUser?.id ?? null,
	};

	next();
};

export { setDashboardPageUserContext };
