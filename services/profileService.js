import pool from "../db/pool.js";
import * as usersDb from "../db/users/index.js";
import toNullableNumber from "../utils/toNullableNumber.js";

async function getProfilePage({ query, sessionState }) {
	const pageState = { userId: toNullableNumber(query?.userId) };
	const userId = query?.userId ?? sessionState?.userId ?? null;

	const [user, userArr] = await Promise.all([
		usersDb.getUserById(pool, { userId }),
		usersDb.getAllUsers(pool),
	]);

	return {
		pageState,
		appState: { user },
		data: {
			users: {
				items: userArr,
			},
		},
	};
}

export { getProfilePage };
