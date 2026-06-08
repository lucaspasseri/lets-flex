import * as usersDb from "../db/users/index.js";
import pool from "../db/pool.js";

const setProfilePageContext = async (req, res, next) => {
	const { userId } = res.locals.profilePageParams;

	let currentUser;

	if (userId === null) {
		const { userId: sessionUserId } = res.locals.sessionState;

		currentUser = sessionUserId
			? await usersDb.getUserById(pool, { userId: sessionUserId })
			: null;
	} else {
		currentUser = userId ? await usersDb.getUserById(pool, { userId }) : null;
	}

	res.locals.appState = { ...res.locals.appState, currentUser };
	res.locals.sessionState = {
		...res.locals.sessionState,
		userId: currentUser?.id ?? null,
	};
	req.session.state = { userId: currentUser?.id ?? null };

	next();
};

export { setProfilePageContext };
