import toNullableNumber from "../../../utils/toNullableNumber.js";
import * as usersRepository from "../users/repository.js";

export async function getProfilePage({ query, sessionState }) {
	const pageState = { userId: toNullableNumber(query?.userId) };
	const userId = query?.userId ?? sessionState?.userId ?? null;

	const [user, userArr] = await Promise.all([
		usersRepository.findById({ userId }),
		usersRepository.findAll(),
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
