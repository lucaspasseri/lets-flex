import * as usersDb from "../db/users/index.js";
import pool from "../db/pool.js";

const setProfilePageContext = async (req, res, next) => {
	let userId = res.locals.profilePageParams?.userId;

	if (userId === null) {
		userId = res.locals.sessionState?.userId;
	}

	const currentUser = userId
		? await usersDb.getUserById(pool, { userId })
		: null;

	res.locals.appState = { ...res.locals.appState, currentUser };
	res.locals.sessionState = {
		...res.locals.sessionState,
		userId: currentUser?.id ?? null,
	};
	req.session.state.userId = currentUser?.id ?? null;

	next();
};

export { setProfilePageContext };
