import createUserSwitcherViewModel from "../viewModels/createUserSwitcherViewModel.js";

function createProfilePageViewModel({ page, pageState, user, userArr }) {
	return {
		page,
		pageState,
		appState: {
			users: {
				current: user,
				items: userArr,
			},
		},
		features: {
			userSwitcher: createUserSwitcherViewModel({ user, userArr }),
		},
	};
}

export default createProfilePageViewModel;
