import * as usersDb from "../db/users/index.js";
import pool from "../db/pool.js";

const setLibraryPageContext = async (req, res, next) => {
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

export { setLibraryPageContext };
